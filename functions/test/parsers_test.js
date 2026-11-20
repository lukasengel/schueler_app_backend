const axios = require("axios");
const { credentials } = require("./credentials");
const { parseIsoDate } = require("../lib/helpers");
const { parseHtml } = require("../lib/parsers");

/**
 * Test function for `parseIsoDate`.
 */
function testParseDate() {
    for (const text of ["31.01.2023 12:00:00", "81.01.2023 12:00:00", "31.01.2023"]) {
        console.log(parseIsoDate(text) ?? "Invalid date.");
    }
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
    console.dir(result, { depth: null });
}

testParseDate();
testParseHtml();
