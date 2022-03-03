import {
    evaluateXPathToString as evaluateString,
    evaluateXPathToStrings as evaluateStrings,
    evaluateXPathToFirstNode as evaluateNode,
    evaluateXPathToNodes as evaluateNodes,
    evaluateXPathToBoolean as evaluateBoolean,
} from "fontoxpath";

import { HymnalDocument, Line, RepeatLines, CACHE_ID } from "./types";

const objectFromEntries = <T extends { id: string }>(entries: T[]) =>
    Object.fromEntries(entries.map(entry => [entry.id, entry]));

export function convert(xmlDocument: XMLDocument): HymnalDocument {
    return {
        CACHE_ID,
        id: evaluateString("/hymnal/@id", xmlDocument),
        year: evaluateString("/hymnal/@year", xmlDocument),
        title: evaluateString("/hymnal/@title", xmlDocument),
        publisher: evaluateString("/hymnal/@publisher", xmlDocument) || null,
        language: evaluateString("/hymnal/@language", xmlDocument),
        languages: objectFromEntries(
            evaluateNodes("/hymnal/languages/language", xmlDocument).map(language => ({
                id: evaluateString("@id", language),
                name: evaluateString("@name", language),
            }))
        ),
        topics: objectFromEntries(
            evaluateNodes("/hymnal/topics/topic", xmlDocument).map(topic => ({
                id: evaluateString("@id", topic),
                name: evaluateString("@name", topic),
            }))
        ),
        calendar: objectFromEntries(
            evaluateNodes("/hymnal/calendar/day", xmlDocument).map(day => ({
                id: evaluateString("@id", day),
                shortName: evaluateString("@shortName", day),
                name: evaluateString("@name", day),
            }))
        ),
        tunes: objectFromEntries(
            evaluateNodes("/hymnal/tunes//tune", xmlDocument).map(tune => ({
                id: evaluateString("@id", tune),
                name: evaluateString("@name", tune),
            }))
        ),
        hymns: objectFromEntries(
            evaluateNodes("/hymnal/hymns/hymn", xmlDocument).map(hymn => ({
                id: evaluateString("@id", hymn),
                title: (evaluateNode("title", hymn) as Node)?.textContent ?? "",
                language:
                    evaluateString("@language", hymn) ||
                    evaluateString("/hymnal/@language", xmlDocument),
                isDeleted: evaluateBoolean("@deleted", hymn),
                isRestricted: evaluateBoolean("@restricted", hymn),
                topics: evaluateStrings("topic/@ref", hymn),
                tunes: evaluateStrings("tune/@ref", hymn),
                origin: evaluateString("origin", hymn),
                authors: evaluateNodes("author", hymn).map(author => ({
                    name: (author as Node).textContent ?? "",
                    year: evaluateString("@year", author),
                    note: evaluateString("@note", author),
                })),
                translators: evaluateNodes("translator", hymn).map(translator => ({
                    name: (translator as Node).textContent ?? "",
                    year: evaluateString("@year", translator),
                    note: evaluateString("@note", translator),
                })),
                days: evaluateStrings("day/@ref", hymn),
                links: evaluateNodes("link", hymn).map(link => ({
                    book: evaluateString("@book", link),
                    edition: evaluateString("@edition", link),
                    id: evaluateString("@id", link),
                })),
                verses: evaluateNodes("verses/verse", hymn).map(verse => ({
                    isDeleted: evaluateBoolean("@deleted", verse),
                    lines: getLines("line|repeat", verse as Node),
                })),
                refrain: evaluateNode("verses/refrain", hymn)
                    ? {
                          isDeleted: evaluateBoolean("verses/refrain/@deleted", hymn),
                          lines: getLines(
                              "verses/refrain/line|verses/refrain/repeat",
                              hymn as Node
                          ),
                      }
                    : null,
                chorus: evaluateNode("verses/chorus", hymn)
                    ? {
                          isDeleted: evaluateBoolean("verses/chorus/@deleted", hymn),
                          lines: getLines(
                              "verses/chorus/line|verses/chorus/repeat",
                              hymn as Node
                          ),
                      }
                    : null,
            }))
        ),
    };
}

const getLines = (selector: string, verse: Node): (Line | RepeatLines)[] =>
    evaluateNodes(selector, verse).map(lineOrRepeat => {
        if ((lineOrRepeat as Node).nodeName === "repeat") {
            return {
                kind: "repeat",
                times: parseInt(evaluateString("@times", lineOrRepeat) || "2", 10),
                lines: evaluateNodes("line", lineOrRepeat).map(line => ({
                    kind: "line",
                    text: (line as Node).textContent ?? "",
                    isDeleted: evaluateBoolean("@deleted", line),
                })),
            };
        }
        return {
            kind: "line",
            text: (lineOrRepeat as Node).textContent ?? "",
            isDeleted: evaluateBoolean("@deleted", lineOrRepeat),
        };
    });