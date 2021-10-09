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

export class HymnalDocument {
    private xmlDocument: XMLDocument;

    constructor(xmlDocument: XMLDocument) {
        this.xmlDocument = xmlDocument;
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

    public get indices() {
        const indices: DocumentIndex[] = [];

        const topicsNode = this.xmlDocument.querySelector("hymnal > topics");
        const topics = [...this.xmlDocument.querySelectorAll("hymnal > topics > topic")];
        if (topics.length > 0) {
            indices.push({
                id: "topics",
                name: topicsNode!.getAttribute("name")!,
                entries: topics.map(topic => {
                    const topicId = topic.getAttribute("id")!;
                    return {
                        name: topic.getAttribute("name")!,
                        url: `?q=topic:${topicId}`,
                        items: [
                            ...this.xmlDocument.querySelectorAll(
                                `hymnal > hymns > hymn > topic[ref="${topicId}"]`
                            ),
                        ].map(topicNode => {
                            const hymnNode = topicNode.parentElement;
                            const title = hymnNode?.querySelector("title")?.textContent;
                            return {
                                url: `#${hymnNode!.getAttribute("id")}`,
                                name: `${hymnNode!.getAttribute("id")!}. ${title}`,
                            };
                        }),
                    };
                }),
            });
        }

        return indices;
    }

    public getHymns(q: string = "") {
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
        const result = this.xmlDocument.evaluate(
            expression,
            this.xmlDocument,
            nsResolver,
            XPathResult.ORDERED_NODE_ITERATOR_TYPE
        );
        const hymns = [];
        let node;
        while ((node = result.iterateNext() as Element)) hymns.push(node);

        return hymns;
    }
}

function nsResolver(prefix: string | null) {
    switch (prefix) {
        case "hr":
            return "hymnalreader.net";
        default:
            return null;
    }
}
