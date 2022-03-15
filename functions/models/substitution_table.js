"use strict";

export class SubstitutionTable {
    constructor({ rows, date, groups }) {
        this.rows = rows;
        this.date = date;
        this.groups = groups;
    }
}

export class SubstitutionTableRow {
    constructor({ course, period, absent, substitute, room, info, group }) {
        this.course = course;
        this.period = period;
        this.absent = absent;
        this.substitute = substitute;
        this.room = room;
        this.info = info;
        this.group = group;
    }
}
