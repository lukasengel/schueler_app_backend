/**
 * Represents a snapshot of external data.
 *
 * This data is fetched from the school's substition plan website.
 */
export type ExternalDataSnapshot = Readonly<{
    /**
     * All available substitution tables. Typically the tables for the next five school days.
     */
    substitutionTables: SubstitutionTable[];

    /**
     * All available news from the principal's office.
     */
    newsItems: NewsItem[];

    /**
     * The content of the news ticker at the bottom of the website.
     */
    tickerItems: string[];

    /**
     * The date when the data on the website was last updated, as ISO 8601 string.
     */
    latestUpdate: string;

    /**
     * The date when this snapshot was fetched, as ISO 8601 string.
     */
    latestFetch: string;
}>;

/**
 * Represents the substitution table for a specific day.
 */
export type SubstitutionTable = Readonly<{
    /**
     * The date of the substitution table, as ISO 8601 string.
     */
    date: string;

    /**
     * The individual substitution rows, i.e. the lessons that are being substituted or changed on that day.
     */
    rows: SubstitutionTableRow[];
}>;

/**
 * Represents a single row within a substitution table, which typically consists of six fields.
 *
 * The field names have been translated from German to English, since the website is in German.
 *
 * The `group` attribute is not directly displayed in the table, but instead used by the frontend to group multiple rows.
 * On the website, in case multiple rows belong to the same course, the course name is only written in the first row.
 * Therefore, the group attribute is determined programmatically.
 * For example:
 *
 * ```
 * Kl. | Std. | Abw. | Ver. | Raum | Info  => Group
 * 5a  | 1    | mma  | jdo  | 101  | -     => 5a
 *     | 2    | mma  | jdo  | 101  | -     => 5a
 * 6a  | 2    | abc  | def  | 201  | -     => 6a
 *     | 3    | abc  | xyz  | 201  | -     => 6a
 *     | 4    | mma  | jdo  | 201  | -     => 6a
 * ```
 */
export type SubstitutionTableRow = Readonly<{
    /**
     * The course or class for which the substitution lesson is scheduled. [German: Klasse]
     */
    course: string;

    /**
     * The period during which the substitution lesson takes place. [German: Stunde]
     */
    period: string;

    /**
     * The absent teacher. [German: Abwesend]
     */
    absent: string;

    /**
     * The substitute teacher. [German: Vertretung]
     */
    substitute: string;

    /**
     * The room where the substituted lesson takes place. [German: Raum]
     */
    room: string;

    /**
     * Additional information or remarks. [German: Info]
     */
    info: string;

    /**
     * The group this row belongs to. Used for frontend grouping logic.
     */
    group: string;
}>;

/**
 * Represents an item on the principal's office news board.
 */
export type NewsItem = Readonly<{
    /**
     * The headline of the item.
     */
    headline: string | undefined;

    /**
     * The subheadline of the item.
     */
    subheadline: string | undefined;

    /**
     * The body text of the item.
     */
    content: string | undefined;
}>;
