import axios from "axios";
import {onSchedule} from "firebase-functions/v2/scheduler";
import admin from "firebase-admin";
import {parseHtml} from "./parsers";

// Initialize Firebase.
admin.initializeApp();

// Register a scheduled function, to execute the `_fetchHtml` function every 15 minutes.
export const fetchHtml = onSchedule("*/15 * * * *", _fetchHtml);

/**
 * Fetch the HTML content from the substitution plan page, parse it and store the data in Cloud Firestore.
 */
async function _fetchHtml() {
    // Retrieve the website credentials from the database.
    const credentials = await admin.firestore().collection("config").doc("dataSource").get();

    // Fetch HTML.
    const response = await axios.get(credentials.get("url"), {
        auth: {
            username: credentials.get("username"),
            password: credentials.get("password"),
        },
    });

    // Parse HTML.
    const snapshot = parseHtml(response.data);

    // Update information in the database.
    await admin.firestore().collection("external").doc("latest").set(snapshot);
}
