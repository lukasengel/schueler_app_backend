"use strict";

import cheerio from "cheerio";
import { parseDate } from "./helpers.js";
import { NewsItem } from "./models/news_item.js";
import { SubstitutionTable, SubstitutionTableRow } from "./models/substitution_table.js"

export class HtmlParser {
    constructor(html) {
        this.query = cheerio.load(html, null, false);
    }

    parseSubstitutions() {
        const $ = this.query;
        let elements = $(".daily_table");
        let list = [];
        for (let i = 0; i < elements.length; i++) {
            let rows = [];
            const rowElements = $(elements[i]).find("tr");
            let group = "";
            let groups = [];

            for (let i = 3; i < rowElements.length; i++) {
                const fields = $(rowElements[i]).find("td");

                if (fields.length == 6) {
                    const course = $(fields[0]).text();
                    if (course != String.fromCharCode(160)) {
                        if (groups.includes(course)) {
                            break;
                        }
                        group = course;
                    }
                    if (!groups.includes(group)) {
                        groups.push(group);
                    }
                    rows.push(new SubstitutionTableRow({
                        course: course,
                        period: $(fields[1]).text().trim(),
                        absent: $(fields[2]).text().trim(),
                        substitute: $(fields[3]).text().trim(),
                        room: $(fields[4]).text().trim(),
                        info: $(fields[5]).text().trim(),
                        group: group,
                    }));

                }
            }
            list.push(new SubstitutionTable({
                rows: rows,
                groups: groups,
                date: parseDate($(rowElements[0]).text()),
            }));
        }
        return list;
    }

    parseNews() {
        const $ = this.query;
        let element = $("#news_container");
        let newsItems = [];

        if (element) {
            const news = $(element).find("div");
            for (let i = 0; i < news.length; i++) {
                let headlines = $(news[i]).find("p");
                let content = $(news[i]).find("span")[0];
                newsItems.push(new NewsItem({
                    headline: $(headlines[0]).text().trim(),
                    subheadline: $(headlines[1]).text().trim(),
                    content: $(content).text().trim(),
                }));
            }
        }
        return newsItems;
    }

    parseTicker() {
        const $ = this.query;
        let element = $(".ticker-wrap_ende");
        if (element) {
            let items = $(element).find(".ticker__item");
            let ticker = "";
            if (items) {
                for (let i = 0; i < items.length; i++) {
                    ticker += $(items[i]).text().trim() + ' ';
                }
            }
            return ticker.trim();
        }
    }

    parseLatestUpdate() {
        const $ = this.query;
        return parseDate($(".text_8pt").text());
    }
}