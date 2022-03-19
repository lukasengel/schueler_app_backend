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

export function containsObject(obj, list) {
    for (let i = 0; i < list.length; i++) {
        if (JSON.stringify(list[i]) === JSON.stringify(obj)) {
            return true;
        }
    }
    return false;
}