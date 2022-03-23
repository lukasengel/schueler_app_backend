"use strict";

import axios from "axios";
import * as functions from "firebase-functions";
import admin from "firebase-admin";
admin.initializeApp();

import { HtmlParser } from "./html_parser.js";
import { containsObject } from "./helpers.js";

const sendSmvNotifications = (change, context) => sendNotifications(change, false);
const sendBroadcastNotifications = (change, context) => sendNotifications(change, true);

export const scheduledFunction = functions.pubsub.schedule("*/15 * * * *").onRun(fetchHtml);
export const schoolLifeNotifications = functions.database.ref("schoolLife").onWrite(sendSmvNotifications);
export const broadcastNotifications = functions.database.ref("broadcast").onWrite(sendBroadcastNotifications);
export const dailyNotifications = functions.database.ref("externalData/substitutionTables/0").onWrite(sendDailyNotifications);

async function fetchHtml(context) {
  const credentials = (await admin.database().ref("credentials").get()).val();

  const response = await axios.get(credentials.url, {
    auth: {
      username: credentials.username,
      password: credentials.password
    }
  });

  const html = response.data;
  const parser = new HtmlParser(html);
  const ref = admin.database().ref("externalData");

  await ref.update({
    "latestUpdate": parser.parseLatestUpdate(),
    "latestFetch": new Date(),
    "news": parser.parseNews(),
    "ticker": parser.parseTicker(),
    "substitutionTables": parser.parseSubstitutions()
  });
}

async function sendNotifications(change, broadcast) {
  const before = change.before.val();
  const after = change.after.val();

  for (const [key, value] of Object.entries(after)) {
    if (!(key in before)) {
      await admin.messaging().send({
        topic: broadcast ? "broadcast" : "smv",
        notification: {
          title: broadcast ? "Rundnachricht: " : "Schulleben: " + value.header,
          body: value.content
        },
        data: {
          "page": broadcast ? "" : "smv",
        },
        android: {
          notification: {
            channelId: "high_importance_channel"
          }
        }
      });
    }
    break;
  }
}

async function sendDailyNotifications(change) {
  const before = change.before.val();
  const after = change.after.val();

  after.groups.forEach(async (group) => {
    const oldList = before.rows.filter((row) => row.group === group);
    const newList = after.rows.filter((row) => row.group === group);

    const newChanges = () => {
      const isValid = group !== "";
      const dataIsDifferent = JSON.stringify(oldList) !== JSON.stringify(newList);
      const dateIsDifferent = JSON.stringify(before.date) !== JSON.stringify(after.date);
      return isValid && (dateIsDifferent || dataIsDifferent);
    }

    if (newChanges()) {
      let count = 0;
      const differentDate = before.date != after.date;

      newList.forEach((item) => {
        if (!containsObject(item, oldList) || differentDate) {
          count++;
        }
      });

      if (!count) {
        return;
      }

      const body = count == 1
        ? "Ein neues Ereignis auf dem Vertretungsplan."
        : `${count} neue Ereignisse auf dem Vertretungsplan.`;

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
          notification: {
            channelId: "high_importance_channel"
          }
        }
      });
    }
  });

}
