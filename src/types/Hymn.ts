import * as xpath from "fontoxpath";

const LANGUAGE_NAMES: { [code: string]: string } = {
    en: "English",
    fi: "Finnish",
    se: "Swedish",
    no: "Norwegian",
};

export type Language = { id: string; name: string };
export type Topic = { id: string; name: string };
export type Tune = { id: string; name: string };
export type Author = { name: string | null; year: string | null };
export type Translator = { name: string | null; year: string | null };
export type Origin = { name: string };
export type Day = { id: string; shortName: string; name: string };

export type Verse = LineGroup[];
export type LineGroup = { lines: string[]; times: number };

export class Hymn {
    private element: Element;

    constructor(element: Element) {
        this.element = element;
    }

    public get id() {
        return xpath.evaluateXPathToString("@id", this.element);
    }
    public get title() {
        const title = xpath.evaluateXPathToString("verses/verse/line[1]", this.element);
        return title || "(no title)";
    }
    public get language(): Language {
        const id = xpath.evaluateXPathToString("@language", this.element);
        return { id, name: LANGUAGE_NAMES[id] };
    }
    public get topics(): Topic[] {
        return xpath.evaluateXPathToStrings("topic/@ref", this.element).map(id => {
            const name = xpath.evaluateXPathToString(
                "hymnal/topics/topic[@id=$id]/@name",
                this.element,
                null,
                { id }
            );
            return { id, name };
        });
    }
    private _tunes: Tune[] | null = null;
    public get tunes(): Tune[] {
        if (this._tunes) return this._tunes;

        this._tunes = xpath.evaluateXPathToStrings("tune/@ref", this.element).map(id => {
            const name = xpath.evaluateXPathToString(
                "/hymnal/tunes//tune[@id=$id]/@name",
                this.element,
                null,
                { id }
            );
            return { id, name: name || id };
        });

        return this._tunes;
    }
    // public get altTunes(): Tune[] {
    //     const ids = this.tunes.map(tune => tune.id);
    //     return ids.flatMap(id =>
    //         evaluate(
    //             `/hr:hymnal/hr:tunes-group[hr:tune[id="${id}"]]/hr:tune`,
    //             this.element
    //         )
    //             .map(node => {
    //                 const id = node.getAttribute("id")!;
    //                 return {
    //                     id,
    //                     name: node.getAttribute("name") || id,
    //                 };
    //             })
    //             .filter(({ id }) => !ids.includes(id))
    //     );
    // }
    public get authors(): Author[] {
        return xpath.evaluateXPathToNodes("author", this.element).map(author => ({
            name: xpath.evaluateXPathToString("@name", author),
            year: xpath.evaluateXPathToString("@year", author),
        }));
    }
    public get origin(): Origin {
        return { name: xpath.evaluateXPathToString("origin", this.element) };
    }
    public get translators(): Translator[] {
        return xpath
            .evaluateXPathToArray("translator", this.element)
            .map(translator => ({
                name: xpath.evaluateXPathToString("@name", translator),
                year: xpath.evaluateXPathToString("@year", translator),
            }));
    }
    public get days(): Day[] {
        return xpath.evaluateXPathToArray("day", this.element).map(day => {
            const id = xpath.evaluateXPathToString("@ref", day);
            const name = xpath.evaluateXPathToString(
                "/hymnal/calendar//day[@id=$id]/@name",
                this.element,
                null,
                { id }
            );
            const shortName = xpath.evaluateXPathToString(
                "/hymnal/calendar//day[@id=$id]/@shortName",
                this.element,
                null,
                { id }
            );
            return {
                id,
                name: name || id,
                shortName: shortName || id,
            };
        });
    }
    public get verses(): Verse[] {
        return xpath
            .evaluateXPathToArray("verses/verse", this.element)
            .map(convertVerse);
    }
    public get refrain(): Verse | null {
        const refrain = xpath.evaluateXPathToFirstNode(
            "verses/refrain",
            this.element
        ) as Node;
        if (refrain) return convertVerse(refrain);
        return null;
    }
    public get chorus(): Verse | null {
        const chorus = xpath.evaluateXPathToFirstNode(
            "verses/chorus",
            this.element
        ) as Node;
        if (chorus) return convertVerse(chorus);
        return null;
    }
}

function convertVerse(verse: Node): LineGroup[] {
    return xpath.evaluateXPathToArray("line|repeat", verse).map(lineOrRepeat => {
        if (lineOrRepeat.localName === "repeat") {
            return {
                times: xpath.evaluateXPathToNumber("times", lineOrRepeat) || 2,
                lines: xpath.evaluateXPathToStrings("line", lineOrRepeat),
            };
        }
        return {
            times: 1,
            lines: [xpath.evaluateXPathToString("line", lineOrRepeat)],
        };
    });
}
