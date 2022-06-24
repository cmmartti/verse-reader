import {
    evaluateXPathToString as evaluateString,
    evaluateXPathToStrings as evaluateStrings,
    evaluateXPathToFirstNode as evaluateNode,
    evaluateXPathToNodes as evaluateNodes,
    evaluateXPathToBoolean as evaluateBoolean,
} from "fontoxpath";

import { Hymnal, Line, RepeatLines } from "./types";

let objectFromEntries = <T extends { id: string }>(entries: T[]) =>
    Object.fromEntries(entries.map(entry => [entry.id, entry]));

export function parseXML(xmlDocument: XMLDocument): Hymnal {
    return {
        id: evaluateString("/hymnal/@id", xmlDocument),
        year: evaluateString("/hymnal/@year", xmlDocument),
        title: evaluateString("/hymnal/@title", xmlDocument),
        publisher: evaluateString("/hymnal/@publisher", xmlDocument) || null,
        language: evaluateString("/hymnal/@language", xmlDocument),
        indices: Object.fromEntries(
            evaluateNodes("/hymnal/indices/index", xmlDocument)
                .map(index => ({
                    type: evaluateString("@type", index),
                    name: evaluateString("@name", index),
                    hasDefaultSort: evaluateBoolean("@has-default-sort", index),
                }))
                .map(index => [index.type, index])
        ),
        languages: objectFromEntries(
            evaluateNodes("/hymnal/languages/language", xmlDocument).map(language => ({
                id: evaluateString("@id", language),
                name: evaluateString("@name", language),
            }))
        ),
        contributors: objectFromEntries(
            evaluateNodes("/hymnal/contributors/contributor", xmlDocument).map(
                topic => ({
                    id: evaluateString("@id", topic),
                    name: evaluateString("@name", topic),
                })
            )
        ),
        topics: objectFromEntries(
            evaluateNodes("/hymnal/topics/topic", xmlDocument).map(topic => ({
                id: evaluateString("@id", topic),
                name: evaluateString("@name", topic),
            }))
        ),
        origins: objectFromEntries(
            evaluateNodes("/hymnal/origins/origin", xmlDocument).map(day => ({
                id: evaluateString("@id", day),
                name: evaluateString("@name", day),
            }))
        ),
        days: objectFromEntries(
            evaluateNodes("/hymnal/days/day", xmlDocument).map(day => ({
                id: evaluateString("@id", day),
                name: evaluateString("@name", day),
            }))
        ),
        tunes: objectFromEntries(
            evaluateNodes("/hymnal/tunes//tune", xmlDocument).map(tune => ({
                id: evaluateString("@id", tune),
                name: evaluateString("@name", tune),
            }))
        ),
        pages: objectFromEntries(
            evaluateNodes("/hymnal/pages/page", xmlDocument).map(page => ({
                id: evaluateString("@id", page),
                title: (evaluateNode("title", page) as Node)?.textContent ?? "",
                language:
                    evaluateString("@language", page) ||
                    evaluateString("/hymnal/@language", xmlDocument),
                isDeleted: evaluateBoolean("@deleted", page),
                isRestricted: evaluateBoolean("@restricted", page),
                topics: evaluateStrings("topic/@ref", page),
                tunes: evaluateStrings("tune/@ref", page),
                origin: evaluateString("origin/@ref", page),
                contributors: evaluateNodes("contributor", page).map(contributor => ({
                    type: evaluateString("@type", contributor) as
                        | "translator"
                        | "author",
                    id: evaluateString("@ref", contributor) ?? null,
                    year: evaluateString("@year", contributor),
                    note: evaluateString("@note", contributor),
                })),
                days: evaluateStrings("day/@ref", page),
                links: evaluateNodes("link", page).map(link => ({
                    book: evaluateString("@book", link),
                    edition: evaluateString("@edition", link),
                    id: evaluateString("@id", link),
                })),
                verses: evaluateNodes("verses/verse", page).map(verse => ({
                    isDeleted: evaluateBoolean("@deleted", verse),
                    lines: getLines("line|repeat", verse as Node),
                })),
                refrain: evaluateNode("verses/refrain", page)
                    ? {
                          isDeleted: evaluateBoolean("verses/refrain/@deleted", page),
                          lines: getLines(
                              "verses/refrain/line|verses/refrain/repeat",
                              page as Node
                          ),
                      }
                    : null,
                chorus: evaluateNode("verses/chorus", page)
                    ? {
                          isDeleted: evaluateBoolean("verses/chorus/@deleted", page),
                          lines: getLines(
                              "verses/chorus/line|verses/chorus/repeat",
                              page as Node
                          ),
                      }
                    : null,
            }))
        ),
    };
}

let getLines = (selector: string, verse: Node): (Line | RepeatLines)[] =>
    evaluateNodes(selector, verse).map(lineOrRepeat => {
        if ((lineOrRepeat as Node).nodeName === "repeat") {
            return {
                kind: "repeat",
                times: parseInt(evaluateString("@times", lineOrRepeat) || "2", 10),
                lines: evaluateNodes("line", lineOrRepeat).map(line => ({
                    kind: "line",
                    text: (line as Node).textContent ?? "",
                })),
            };
        }
        return {
            kind: "line",
            text: (lineOrRepeat as Node).textContent ?? "",
        };
    });
