import moment from "moment-timezone";

/**
 * Parse a date in format "dd.MM.yyyy" or "dd.MM.yyyy HH:mm:ss" from a string to a string in ISO 8601 format.
 *
 * @param {string} text Text containing a date.
 * @return {string | undefined} String in ISO 8601 format, or undefined if the text does not contain a valid date.
 */
export function parseIsoDate(text: string): string | undefined {
    const dateRegex = RegExp("\\d\\d\\.\\d\\d\\.\\d\\d\\d\\d");
    const timeRegex = RegExp("\\d\\d\\:\\d\\d\\:\\d\\d");

    const dateMatch = dateRegex.exec(text);
    const timeMatch = timeRegex.exec(text);

    // If the string contains a date.
    if (dateMatch != null) {
        // Parse date (and time, if available) to a Moment object.
        // If a time is available, assume it's given in the "Europe/Berlin" timezone.
        const parsedMoment = moment.tz(
            timeMatch != null ? `${dateMatch[0]} ${timeMatch[0]}` : dateMatch[0],
            timeMatch != null ? "DD.MM.YYYY HH:mm:ss" : "DD.MM.YYYY",
            timeMatch != null ? "Europe/Berlin" : "UTC",
        );

        // If the date is valid, return it.
        if (parsedMoment.isValid()) {
            return parsedMoment.toISOString();
        }
    }

    // If no valid date is found, return undefined.
    return undefined;
}
