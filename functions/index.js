"use strict";

import axios from "axios";
import * as functions from "firebase-functions";
import admin from "firebase-admin";

import { HtmlParser } from "./html_parser.js";
import { containsObject } from "./helpers.js";

// Initialize Firebase
admin.initializeApp();

// Define cloud function callbacks
const scheduledFunctionCallback = (context) => invokeEnabledFunction("scheduledFunction", fetchHtml);
const schoolLifeNotificationsCallback = (change, context) => invokeEnabledFunction("schoolLifeNotifications", () => sendNotifications(change, false));
const broadcastNotificationsCallback = (change, context) => invokeEnabledFunction("broadcastNotifications", () => sendNotifications(change, true));
const dailyNotificationsCallback = (change, context) => invokeEnabledFunction("dailyNotifications", () => sendDailyNotifications(change));

// Register cloud functions
export const scheduledFunction = functions.pubsub.schedule("*/15 * * * *").onRun(scheduledFunctionCallback);
export const schoolLifeNotifications = functions.database.ref("schoolLife").onWrite(schoolLifeNotificationsCallback);
export const broadcastNotifications = functions.database.ref("broadcast").onWrite(broadcastNotificationsCallback);
export const dailyNotifications = functions.database.ref("externalData/substitutionTables/0").onWrite(dailyNotificationsCallback);

/**
 * Invoke the function callback only if the flag corresponding to the given name is set to true.
 * 
 * @param {string} name Name of the function
 * @param {Promise<void>} callback Callback to be executed if the function is enabled
 */
async function invokeEnabledFunction(name, callback) {
  // Look up if a function is enabled (i.e. check flag stored in database)
  const enabled = (await admin.database().ref(`functions/${name}`).get()).val();

  // Log the current state
  await admin.database().ref(`functions/meta/latestState/${name}`).set(enabled);

  // Execute the callback if the function is enabled
  if (enabled === true) {
    await callback();
  }
}

/**
 * Fetch the HTML content from the external source, parse it and store the relevant data in the database.
 * Called every 15 minutes.
 */
async function fetchHtml() {
  // Retrieve the credentials from the database
  const credentials = (await admin.database().ref("credentials").get()).val();

  // Fetch HTML
  const response = await axios.get(credentials.url, {
    auth: {
      username: credentials.username,
      password: credentials.password
    }
  });

  // Parse HTML
  const html = response.data;
  const parser = new HtmlParser(html);
  const ref = admin.database().ref("externalData");

  // Update information in the database
  await ref.update({
    "latestUpdate": parser.parseLatestUpdate(),
    "latestFetch": new Date(),
    "news": parser.parseNews(),
    "ticker": parser.parseTicker(),
    "substitutionTables": parser.parseSubstitutions()
  });
}

/**
 * Send push notifications for new broadcasts or school life items.
 * Called upon changes in the database.
 * 
 * @param {functions.Change<functions.database.DataSnapshot>} change Before and after states of the database
 * @param {boolean} broadcast Boolean indicating whether the notification is a broadcast or a school life item
 */
async function sendNotifications(change, broadcast) {
  const before = change.before.val();
  const after = change.after.val();

  if (after) {
    // Iterate over the all items (i.e. broadcasts or school life items) in the new snapshot
    for (const [key, value] of Object.entries(after)) {

      // Only proceed if the item is not in the old snapshot
      if (!before || !(key in before)) {

        // If the item is a school life item, check if it has already been notified about
        // This is necessary to prevent multiple notifications for the same item
        if(!broadcast) {
          // Retrieve the list of notified items from the database
          const notifiedRef = admin.database().ref("functions/meta/notified");
          const notifiedSnapshot = await notifiedRef.once("value");
          let notifiedList = notifiedSnapshot.val() || [];

          // If the item has already been notified about, skip it
          if (notifiedList.includes(key)) {
            continue;
          }
        
          // Add the item to the list of notified items
          notifiedList.push(key);
        
          // Update the list in the database
          await notifiedRef.set(notifiedList);
        }

        // Send the push notification
        await admin.messaging().send({
          topic: broadcast ? "broadcast" : "smv",
          notification: {
            title: (broadcast ? "Rundnachricht: " : "Schulleben: ") + value.header,
            body: value.content
          },
          data: {
            "page": broadcast ? "" : "smv",
          },
          android: {
            ttl: 172_800_000 //127_800s = 48h
          },
          apns: {
            headers: {
              "apns-priority": "5",
              "apns-expiration": (Math.floor(new Date().getTime() / 1000) + 43_200).toString() //43_200s = 12h
            },
            payload: {
              aps: {
                "badge": 1,
                "sound": 'default'
              }
            }
          },
        });
      }
      continue;
    }
  }
}

/**
 * Send push notifications about substitutions.
 * Called upon changes in the database.
 * 
 * @param {functions.Change<functions.database.DataSnapshot>} change 
 */
async function sendDailyNotifications(change) {
  const before = change.before.val();
  const after = change.after.val();

  // Iterate over all groups (e.g. classes) in the new snapshot
  after.groups.forEach(async (group) => {
    const oldList = before.rows.filter((row) => row.group === group);
    const newList = after.rows.filter((row) => row.group === group);

    // Check if any changes have been made
    const newChanges = () => {
      const isValid = group !== "";
      const dataIsDifferent = JSON.stringify(oldList) !== JSON.stringify(newList);
      const dateIsDifferent = JSON.stringify(before.date) !== JSON.stringify(after.date);
      return isValid && (dateIsDifferent || dataIsDifferent);
    }

    // Only proceed if there are changes in the substitutions
    if (newChanges()) {
      let count = 0;
      const differentDate = before.date != after.date;

      // Count the number of new substitutions
      newList.forEach((item) => {
        // If the substitution is not in the old list or the date has changed, increment the counter
        if (!containsObject(item, oldList) || differentDate) {
          count++;
        }
      });

      // If the number of new substitutions is zero, do not send a notification
      if (!count) {
        return;
      }

      // Determine the notification body
      const body = count == 1
        ? "Ein neues Ereignis auf dem Vertretungsplan."
        : `${count} neue Ereignisse auf dem Vertretungsplan.`;

      // Send the push notification
      await admin.messaging().send({
        topic: group,
        notification: {
          title: `Neue Vertretungen: ${group}`,
          body: body,
        },
        data: {
          "page": "substitutions"
        },
        android: {
          ttl: 172_800_000 //127_800s = 48h
        },
        apns: {
          headers: {
            "apns-priority": "5",
            "apns-expiration": (Math.floor(new Date().getTime() / 1000) + 43_200).toString() //43_200s = 12h
          },
          payload: {
            aps: {
              "badge": 1,
              "sound": 'default'
            }
          }
        },
      });
    }
  });

}
