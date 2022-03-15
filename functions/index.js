"use strict";

import axios from "axios";
import { HtmlParser } from "./html_parser.js";
import * as functions from "firebase-functions";
import admin from "firebase-admin";
admin.initializeApp();

export const scheduledFunction = functions.pubsub.schedule("*/15 * * * *").onRun(fetchHtml);

async function fetchHtml(context) {
    let response = await axios.get("https://schule-infoportal.de/infoscreen/?type=student&days=5&news=1&absent=&absent2=1", {
      auth: {
        username: "*",
        password: "*",
      }
    });

    let html = response.data;
    const parser = new HtmlParser(html);
    const ref = admin.database().ref("externalData");

    ref.update({
      "latestUpdate": parser.parseLatestUpdate(),
      "latestFetch": new Date(),
      "news": parser.parseNews(),
      "ticker": parser.parseTicker(),
      "substitutionTables": parser.parseSubstitutions(),
    });
    
  return 0;
}