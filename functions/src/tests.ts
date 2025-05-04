import axios from "axios";
import {credentials} from "./credentials";
import {parseDate} from "./helpers";
import {parseHtml} from "./parsers";

/**
 * Test function for `parseDate`.
 */
function testParseDate() {
    const result1 = parseDate("31.01.2023 12:00:00");
    console.log(result1 != undefined ? result1.toISOString() : "Invalid date.");

    const result2 = parseDate("81.01.2023 12:00:00");
    console.log(result2 != undefined ? result2.toISOString() : "Invalid date.");

    const result3 = parseDate("31.01.2023");
    console.log(result3 != undefined ? result3.toISOString() : "Invalid date.");
}

/**
 * Test function for `parseHtml`.
 */
async function testParseHtml() {
    // Fetch website.
    const response = await axios.get(credentials.url, {
        auth: {
            username: credentials.username,
            password: credentials.password,
        },
    });

    // Parse HTML.
    const result = parseHtml(response.data);
    console.log(result);
}

testParseDate();
testParseHtml();
