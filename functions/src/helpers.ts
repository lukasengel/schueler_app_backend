import moment from "moment-timezone";

/**
 * Parse a date in format "dd.MM.yyyy" or "dd.MM.yyyy HH:mm:ss" from a string to a Date object.
 *
 * @param {string} text Text to be parsed.
 * @return {Date | undefined} Date object or undefined if the text does not contain a valid date.
 */
export function parseDate(text: string): Date | undefined {
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
            return parsedMoment.toDate();
        }
    }

    // If no valid date is found, return undefined.
    return undefined;
}
