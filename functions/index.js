"use strict";

import axios from "axios";
import * as functions from "firebase-functions";
import admin from "firebase-admin";
admin.initializeApp();

import { HtmlParser } from "./html_parser.js";

export const scheduledFunction = functions.pubsub.schedule("*/15 * * * *").onRun(fetchHtml);

async function fetchHtml(context) {
  const credentials = (await admin.database().ref("credentials").get()).val();

  let response = await axios.get(credentials.url, {
    auth: {
      username: credentials.username,
      password: credentials.password
    }
  });

  let html = response.data;
  const parser = new HtmlParser(html);
  const ref = admin.database().ref("externalData");

  await ref.update({
    "latestUpdate": parser.parseLatestUpdate(),
    "latestFetch": new Date(),
    "news": parser.parseNews(),
    "ticker": parser.parseTicker(),
    "substitutionTables": parser.parseSubstitutions()
  });

  return 0;
}