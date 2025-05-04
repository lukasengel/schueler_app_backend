import * as cheerio from "cheerio";
import {ExternalDataSnapshot, NewsItem, SubstitutionTable, SubstitutionTableRow} from "./models";
import {parseDate} from "./helpers";

/**
 * Parse the HTML of the substitution plan website to an ExternalDataSnapshot object.
 *
 * @param {string} html - The HTML content of the substitution plan website.
 * @return {ExternalDataSnapshot} An object containing the parsed data.
 */
export function parseHtml(html: string): ExternalDataSnapshot {
    const queryingApi = cheerio.load(html);

    return {
        substitutionTables: parseSubstitutionTables(queryingApi),
        newsItems: parseNewsItems(queryingApi),
        tickerItems: parseTickerItems(queryingApi),
        latestUpdate: parseLatestUpdate(queryingApi),
        latestFetch: new Date(),
    };
}

/**
 * Parse the substitution tables from the HTML content.
 *
 * @param {cheerio.CheerioAPI} $ - The Cheerio API instance.
 * @return {SubstitutionTable[]} An array of parsed substitution tables.
 */
function parseSubstitutionTables($: cheerio.CheerioAPI): SubstitutionTable[] {
    const tables: SubstitutionTable[] = [];
    const tableElements = $(".daily_table");

    // Iterate through each table element and extract date and rows.
    for (const tableElement of tableElements) {
        const rows : SubstitutionTableRow[] = [];
        const rowElements = $(tableElement).find("tr");
        const dateElement = $(tableElement).find(".daily_date_hdl");

        // Keep track of all available groups and the current group.
        const groups: Set<string> = new Set();
        let currentGroup = "";

        // Iterate through all rows in the table.
        // Start in the second row, since the first row contains the header.
        for (let i = 1; i < rowElements.length; i++) {
            const fieldElements = $(rowElements[i]).find("td");

            if (fieldElements.length == 6) {
                // Extract the course field of the row.
                let course = $(fieldElements[0]).text();

                // If the course is not a non-breaking space, it means it's the first row of a group.
                if (course != String.fromCharCode(160)) {
                    currentGroup = course;
                }

                // For some weird reason, on the website, a group is sometimes split up into multiple table segments.
                // In order to avoid the course name to appear multiple times, we remove it from the row if it already exists in the group set.
                if (groups.has(course)) {
                    course = "";
                } else {
                    groups.add(currentGroup);
                }

                rows.push({
                    course: course.trim(),
                    period: $(fieldElements[1]).text().trim(),
                    absent: $(fieldElements[2]).text().trim(),
                    substitute: $(fieldElements[3]).text().trim(),
                    room: $(fieldElements[4]).text().trim(),
                    info: $(fieldElements[5]).text().trim(),
                    group: currentGroup,
                });
            }
        }

        tables.push({
            date: parseDate(dateElement.text()) ?? new Date(1970),
            rows: rows,
        });
    }

    return tables;
}

/**
 * Parse the news items from the HTML content.
 *
 * @param {cheerio.CheerioAPI} $ - The Cheerio API instance.
 * @return {NewsItem[]} An array of parsed news items.
 */
function parseNewsItems($: cheerio.CheerioAPI): NewsItem[] {
    const newsItems: NewsItem[] = [];
    const elements = $(".news");

    for (const element of elements) {
        // Extract the headline, subheadline, and content.
        const headline = $(element).find(".news_headline_1").text().trim();
        const subheadline = $(element).find(".news_headline_2").text().trim();
        const content = $(element).find(".news_text").text().trim();

        // If at least one of the fields is not empty, create an item.
        if (headline || subheadline || content) {
            newsItems.push({
                headline: headline || undefined,
                subheadline: subheadline || undefined,
                content: content || undefined,
            });
        }
    }

    return newsItems;
}

/**
 * Parse the ticker items from the HTML content.
 *
 * @param {cheerio.CheerioAPI} $ - The Cheerio API instance.
 * @return {string[]} An array of parsed ticker items.
 */
function parseTickerItems($: cheerio.CheerioAPI): string[] {
    const tickerItems: string[] = [];
    const elements = $(".ticker__item");

    for (const element of elements) {
        // Extract the text of the ticker item.
        const item = $(element).text().trim();

        // If the text is not empty, add it to the array.
        if (item) {
            tickerItems.push(item);
        }
    }

    return tickerItems;
}

/**
 * Parse the latest update date from the HTML content.
 *
 * @param {cheerio.CheerioAPI} $ - The Cheerio API instance.
 * @return {Date} The parsed latest update date.
 */
function parseLatestUpdate($: cheerio.CheerioAPI): Date {
    const latestUpdate = $(".copyright p").text();
    return parseDate(latestUpdate) ?? new Date(1970);
}
