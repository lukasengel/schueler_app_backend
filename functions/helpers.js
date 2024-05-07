/**
 * Parse a string with format "dd.MM.yyyy" or "dd.MM.yyyy HH:mm:ss" to a Date object.
 * 
 * @param {string} text Text to be parsed
 * @returns {Date | undefined} Date object or undefined if the text does not contain a valid date
 */
export function parseDate(text) {
    const regexDate = RegExp("\\d\\d\\.\\d\\d\\.\\d\\d\\d\\d");
    const regexTime = RegExp("\\d\\d\\:\\d\\d\\:\\d\\d");

    const date = regexDate.exec(text);
    const time = regexTime.exec(text);

    if (date && time) {
        const dateParts = date[0].split('.');
        const timeParts = time[0].split(':');
        return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0], timeParts[1], timeParts[2]);
    } else if (date) {
        const dateParts = date[0].split('.');
        return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
    }
}

/**
 * Check if the given object is contained in the list.
 * 
 * @param {object} obj Object to be checked
 * @param {Array<object>} list List of objects
 * @returns {boolean} True if the object is contained in the list, false otherwise
 */
export function containsObject(obj, list) {
    for (let i = 0; i < list.length; i++) {
        if (JSON.stringify(list[i]) === JSON.stringify(obj)) {
            return true;
        }
    }
    return false;
}