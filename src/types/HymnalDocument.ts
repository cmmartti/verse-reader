import * as xpath from "fontoxpath";

export class HymnalDocument {
    private xmlDocument: XMLDocument;

    constructor(xmlDocument: XMLDocument) {
        this.xmlDocument = xmlDocument;
    }

    public get id() {
        return xpath.evaluateXPathToString("/hymnal/@id", this.xmlDocument);
    }
    public get year() {
        return xpath.evaluateXPathToString("/hymnal/@year", this.xmlDocument);
    }
    public get title() {
        return xpath.evaluateXPathToString("/hymnal/@title", this.xmlDocument);
    }
    public get language() {
        return xpath.evaluateXPathToString("/hymnal/@language", this.xmlDocument);
    }

    public get topics() {
        return xpath.evaluateXPathToNodes(
            "/hymnal/topics/topic",
            this.xmlDocument
        ) as Element[];
    }
    public get calendar() {
        return xpath.evaluateXPathToNodes("/hymnal/calendar/days", this.xmlDocument);
    }
    public get tunes() {
        return xpath.evaluateXPathToNodes("/hymnal/tunes//tune", this.xmlDocument);
    }
    public get authors() {
        const authors = xpath.evaluateXPathToStrings(
            "/hymnal/hymns/hymn/(author|translator)/@name",
            this.xmlDocument
        );
        return [...new Set(authors)]; // de-duplicate
    }
    public get origins() {
        const origins = xpath.evaluateXPathToStrings(
            "/hymnal/hymns/hymn/origin",
            this.xmlDocument
        );
        return [...new Set(origins)]; // de-duplicate
    }
    public get languages() {
        const languages = [
            this.language,
            ...xpath.evaluateXPathToStrings(
                "/hymnal/hymns/hymn/@lang",
                this.xmlDocument
            ),
        ];
        return [...new Set(languages)]; // de-duplicate
    }

    public getAllHymns() {
        return xpath.evaluateXPathToNodes(
            "/hymnal/hymns/hymn",
            this.xmlDocument
        ) as Element[];
    }

    public getHymns(q: string = "") {
        /* Search keyword examples:
            !exact
            tune:276
            author:luther
            author:"m. luther"
            author:england
            trans:juvonen
            trans:"a. juvonen"
            trans:norway
            lang:fi
            topic:heaven
            topic:"good friday"
            day:christmas
            day:2s-after-easter
        */
        const keywordsRegex = new RegExp(/([A-Za-z_-]+):([0-9A-Za-z_-]+)/, "gi");
        const search = {
            raw: q,
            text: q
                .replaceAll(keywordsRegex, "") // remove keywords
                .replaceAll(/\s/g, " ") // normalise space
                .trim()
                .toLowerCase(),
            keywords: [...q.matchAll(keywordsRegex)].map(
                match => [match[1], match[2]] as Keyword
            ),
        };

        const predicates: string[] = [];

        for (const [keyword, value] of search.keywords) {
            switch (keyword) {
                case "topic":
                    predicates.push(`[topic/@ref="${value}"]`);
                    break;

                case "tune": {
                    const tuneID = xpath.evaluateXPathToString(
                        "hymnal/hymns/hymn[@id=$id]/tune/@ref",
                        this.xmlDocument,
                        null,
                        { id: value }
                    );
                    if (tuneID) predicates.push(`[tune/@ref="${tuneID}"]`);
                    break;
                }

                case "lang": {
                    if (value === this.language) predicates.push("[not(@language)]");
                    else predicates.push(`[@language="${value}"]`);
                    break;
                }

                case "day":
                    predicates.push(`[day/@ref = ${value}"]`);
                    break;

                case "has":
                    switch (value) {
                        case "refrain":
                            predicates.push("[verses/refrain]");
                            break;
                        case "chorus":
                            predicates.push("[verses/chorus]");
                            break;
                        case "repeat":
                            predicates.push("[verses//repeat]");
                            break;
                        case "deleted":
                            predicates.push("[verses//*[@deleted]]");
                            break;
                    }
                    break;

                case "hasnot":
                    switch (value) {
                        case "refrain":
                            predicates.push("[not(verses//refrain)]");
                            break;
                        case "chorus":
                            predicates.push("[not(verses//chorus)]");
                            break;
                        case "repeat":
                            predicates.push("[not(verses//repeat)]");
                            break;
                        case "deleted":
                            predicates.push("[not(verses//*[@deleted])]");
                            break;
                    }
                    break;

                case "is":
                    switch (value) {
                        case "deleted":
                            predicates.push("[@deleted]");
                            break;
                        case "restricted":
                            predicates.push("[@restricted]");
                            break;
                        case "new":
                            predicates.push(`[not(link[@edition < "${this.year}"])]`);
                            break;
                        case "kept":
                            predicates.push(`[link[@edition > "${this.year}"]]`);
                            break;
                    }
                    break;

                case "isnot":
                    switch (value) {
                        case "deleted":
                            predicates.push("[not(@deleted)]");
                            break;
                        case "restricted":
                            predicates.push("[not(@restricted)]");
                            break;
                        case "new":
                            predicates.push(`[link[@edition < "${this.year}"]]`);
                            break;
                        case "kept":
                            predicates.push(`[not(link[@edition > "${this.year}"])]`);
                            break;
                    }
                    break;
            }
        }

        let variables: { [key: string]: string } = {};

        // Avoid injection vulnerabilities by using XPath variables
        if (search.text) {
            predicates.push(`[./verses//line[
                contains(
                    normalize-space(
                        translate(
                            translate(., '“”’.,;:?!-', ''),
                            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                            'abcdefghijklmnopqrstuvwxyz'
                        )
                    ),
                    $text
                )
            ]]`);
            variables["text"] = search.text;
        }

        return xpath.evaluateXPathToStrings(
            `/hymnal/hymns/hymn${predicates.join("")}/@id`,
            this.xmlDocument,
            null,
            variables
        );
    }
}

export type Keyword = [keyword: string, value: string];
export type Search = {
    raw: string;
    text: string;
    keywords: Keyword[];
};
