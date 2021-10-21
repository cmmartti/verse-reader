function nameSpaceResolver(prefix: string | null) {
    switch (prefix) {
        case "hr":
            return "hymnalreader.net";
        default:
            return null;
    }
}

function evaluate(expression: string, contextNode: Node) {
    const xpe = new XPathEvaluator();
    const result = xpe.evaluate(
        expression,
        contextNode,
        nameSpaceResolver,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE,
        null
    );
    const found = [];
    let res;
    while ((res = result.iterateNext())) {
        found.push(res as Element);
    }
    return found;
}

function evaluateOne(expression: string, contextNode: Node) {
    const xpe = new XPathEvaluator();
    const result = xpe.evaluate(
        expression,
        contextNode,
        nameSpaceResolver,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
    );
    return result.singleNodeValue as Element | null;
}

export class HymnalDocument {
    private xmlDocument: XMLDocument;
    private _hymns: Map<string, HymnValue>;

    constructor(xmlDocument: XMLDocument) {
        this.xmlDocument = xmlDocument;
        this._hymns = new Map();
    }

    public get id() {
        return this.xmlDocument.documentElement.getAttribute("id");
    }
    public get title() {
        return this.xmlDocument.documentElement.getAttribute("title");
    }
    public get language() {
        return this.xmlDocument.documentElement.getAttribute("language");
    }

    // public get indices() {
    //     const indices: DocumentIndex[] = [];

    //     const topicsNode = this.xmlDocument.querySelector("hymnal > topics");
    //     const topics = [...this.xmlDocument.querySelectorAll("hymnal > topics > topic")];
    //     if (topics.length > 0) {
    //         indices.push({
    //             id: "topics",
    //             name: topicsNode!.getAttribute("name")!,
    //             entries: topics.map(topic => {
    //                 const topicId = topic.getAttribute("id")!;
    //                 return {
    //                     name: topic.getAttribute("name")!,
    //                     url: `?q=topic:${topicId}`,
    //                     items: [
    //                         ...this.xmlDocument.querySelectorAll(
    //                             `hymnal > hymns > hymn > topic[ref="${topicId}"]`
    //                         ),
    //                     ].map(topicNode => {
    //                         const hymnNode = topicNode.parentElement;
    //                         const title = hymnNode?.querySelector("title")?.textContent;
    //                         return {
    //                             url: `#${hymnNode!.getAttribute("id")}`,
    //                             name: `${hymnNode!.getAttribute("id")!}. ${title}`,
    //                         };
    //                     }),
    //                 };
    //             }),
    //         });
    //     }

    //     return indices;
    // }

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
                .trim(),
            keywords: [...q.matchAll(keywordsRegex)].map(
                match => [match[1], match[2]] as Keyword
            ),
        };

        const predicates: string[] = [];

        for (const [keyword, value] of search.keywords) {
            switch (keyword) {
                case "topic":
                    predicates.push(`[hr:topic/@ref = "${value}"]`);
                    break;
                case "tune": {
                    const tuneRef = this.xmlDocument.querySelector(
                        `hymnal > hymns > hymn[id="${value}"] tune[ref]`
                    );
                    const tuneID = tuneRef?.getAttribute("ref")!;
                    if (tuneID) predicates.push(`[hr:tune/@ref="${tuneID}"]`);
                    break;
                }
                case "day":
                    predicates.push(`[hr:day/@ref = "${value}"]`);
                    break;
                case "has":
                    switch (value) {
                        case "refrain":
                        case "chorus":
                        case "repeat":
                            predicates.push(`[.//hr:${value}]`);
                    }
                    break;
                // case "author":
                //     predicates.push(`[hr:author="${value}"]`);
                //     break;
            }
        }

        if (search.text) {
            predicates.push(`[./hr:verses/hr:verse[
                    contains(
                        normalize-space(
                            translate(
                                translate(., '“”’.,;:?!-', ''),
                                'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                                'abcdefghijklmnopqrstuvwxyz'
                            )
                        ),
                        "${search.text.toLowerCase()}"
                    )
                ]]`);
        }

        const expression = `/hr:hymnal/hr:hymns/hr:hymn${predicates.join("")}`;
        return evaluate(expression, this.xmlDocument);

        // const nodes = evaluate(expression, this.xmlDocument);
        // return nodes.map(node => {
        //     const id = node.getAttribute("id")!;

        //     if (this._hymns.get(id)) {
        //         return this._hymns.get(id);
        //     }
        //     const value = new HymnValue(node);
        //     this._hymns.set(id, value);
        //     return value;
        // });
    }
}

export class HymnValue {
    private element: Element;

    constructor(element: Element) {
        this.element = element;
    }

    public get id(): string {
        return this.element.getAttribute("id")!;
    }
    public get title(): string {
        return evaluateOne("hr:title", this.element)!.textContent!;
    }
    public get topics(): Topic[] {
        return evaluate("hr:topic", this.element).map(node => {
            const id = node.getAttribute("ref")!;
            const name = evaluateOne(
                `hr:hymnal/hr:topics/hr:topic[id="${id}"]`,
                this.element
            )?.getAttribute("name");
            return {
                id,
                name: name || id,
            };
        });
    }
    private _tunes: Tune[] | null = null;
    public get tunes(): Tune[] {
        if (this._tunes) return this._tunes;

        const tunes = evaluate("hr:tune", this.element).map(node => {
            const id = node.getAttribute("ref")!;
            const name = evaluateOne(
                `/hr:hymnal/hr:topics//hr:tune[id="${id}"]`,
                this.element
            )?.getAttribute("name");
            return {
                id,
                name: name || id,
            };
        });

        this._tunes = tunes;
        return tunes;
    }
    public get altTunes(): Tune[] {
        const ids = this.tunes.map(tune => tune.id);
        return ids.flatMap(id =>
            evaluate(
                `/hr:hymnal/hr:tunes-group[hr:tune[id="${id}"]]/hr:tune`,
                this.element
            )
                .map(node => {
                    const id = node.getAttribute("id")!;
                    return {
                        id,
                        name: node.getAttribute("name") || id,
                    };
                })
                .filter(({id}) => !ids.includes(id))
        );
    }
    public get authors(): Author[] {
        return evaluate("hr:author", this.element).map(node => ({
            name: node.textContent,
            year: node.getAttribute("year"),
            country: node.getAttribute("country"),
        }));
    }
    public get translators(): Translator[] {
        return evaluate("hr:translator", this.element).map(node => ({
            name: node.textContent,
            year: node.getAttribute("year"),
        }));
    }
    public get days(): Day[] {
        return evaluate("hr:day", this.element).map(node => {
            const id = node.getAttribute("ref")!;
            const name = evaluateOne(
                `hr:hymnal/hr:calendar//hr:day[id="${id}"]`,
                this.element
            );
            return {
                id,
                name: name?.getAttribute("name") || id,
                shortName: name?.getAttribute("shortName") || id,
            };
        });
    }
    public get verses(): Verse[] {
        return evaluate("hr:verses/hr:verse", this.element).map(verse =>
            convertVerse(verse)
        );
    }
    public get refrain(): Verse | null {
        const refrain = evaluateOne("hr:verses/refrain", this.element);
        if (refrain) return convertVerse(refrain);
        return null;
    }
    public get chorus(): Verse | null {
        const chorus = evaluateOne("hr:verses/chorus", this.element);
        if (chorus) return convertVerse(chorus);
        return null;
    }
}

function convertVerse(verse: Element) {
    return evaluate("./hr:line|hr:repeat", verse).map(lineOrRepeat => {
        if (lineOrRepeat.localName === "repeat")
            return {
                times: parseInt(lineOrRepeat.getAttribute("times") ?? "2", 10),
                lines: evaluate("line", lineOrRepeat).map(
                    line => line.textContent ?? ""
                ),
            };
        return {
            times: 1,
            lines: [lineOrRepeat.textContent ?? ""],
        };
    });
}

export type Keyword = [keyword: string, value: string];
export type Search = {
    raw: string;
    text: string;
    keywords: Keyword[];
};

export type DocumentIndex = {
    id: string;
    name: string;
    entries: {
        url: string;
        name: string;
        items: {
            url: string;
            name: string;
        }[];
    }[];
};

export type Topic = {
    id: string;
    name: string;
};

export type Verse = LineGroup[];
export type LineGroup = {
    lines: string[];
    times: number;
};

export type Tune = {
    id: string;
    name: string;
};

export type Author = {
    name: string | null;
    year: string | null;
    country: string | null;
};

export type Translator = {
    name: string | null;
    year: string | null;
};

export type Day = {
    id: string;
    shortName: string;
    name: string;
};
