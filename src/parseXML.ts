import {
   evaluateXPathToString as toString,
   evaluateXPathToStrings as toStrings,
   evaluateXPathToFirstNode as toNode,
   evaluateXPathToNodes as toNodes,
   evaluateXPathToBoolean as toBoolean,
} from "fontoxpath";

import { Hymnal, Line, RepeatLines } from "./types";

let objectFromEntries = <T extends { id: string }>(entries: T[]) =>
   Object.fromEntries(entries.map(entry => [entry.id, entry]));

export function parseXML(xmlDocument: XMLDocument): Hymnal {
   return {
      year: toString("/hymnal/@year", xmlDocument),
      title: toString("/hymnal/@title", xmlDocument),
      subtitle: toString("/hymnal/@subtitle", xmlDocument) || null,
      publisher: toString("/hymnal/@publisher", xmlDocument) || null,
      language: toString("/hymnal/@language", xmlDocument),
      indices: Object.fromEntries(
         toNodes("/hymnal/indices/index", xmlDocument)
            .map(index => ({
               type: toString("@type", index),
               name: toString("@name", index),
               hasDefaultSort: toBoolean("@has-default-sort", index),
            }))
            .map(index => [index.type, index])
      ),
      languages: objectFromEntries(
         toNodes("/hymnal/languages/language", xmlDocument).map(language => ({
            id: toString("@id", language),
            name: toString("@name", language),
         }))
      ),
      contributors: objectFromEntries(
         toNodes("/hymnal/contributors/contributor", xmlDocument).map(topic => ({
            id: toString("@id", topic),
            name: toString("@name", topic),
         }))
      ),
      topics: objectFromEntries(
         toNodes("/hymnal/topics/topic", xmlDocument).map(topic => ({
            id: toString("@id", topic),
            name: toString("@name", topic),
         }))
      ),
      origins: objectFromEntries(
         toNodes("/hymnal/origins/origin", xmlDocument).map(day => ({
            id: toString("@id", day),
            name: toString("@name", day),
         }))
      ),
      days: objectFromEntries(
         toNodes("/hymnal/days/day", xmlDocument).map(day => ({
            id: toString("@id", day),
            name: toString("@name", day),
         }))
      ),
      tunes: objectFromEntries(
         toNodes("/hymnal/tunes//tune", xmlDocument).map(tune => ({
            id: toString("@id", tune),
            name: toString("@name", tune),
         }))
      ),
      pages: objectFromEntries(
         toNodes("/hymnal/pages/page", xmlDocument).map(page => ({
            id: toString("@id", page),
            title: (toNode("title", page) as Node)?.textContent ?? "",
            language:
               toString("@language", page) || toString("/hymnal/@language", xmlDocument),
            isDeleted: toBoolean("@deleted", page),
            isRestricted: toBoolean("@restricted", page),
            topics: toStrings("topic/@ref", page),
            tunes: toStrings("tune/@ref", page),
            origin: toString("origin/@ref", page),
            contributors: toNodes("contributor", page).map(contributor => ({
               type: toString("@type", contributor) as "translator" | "author",
               id: toString("@ref", contributor) ?? null,
               year: toString("@year", contributor),
               note: toString("@note", contributor),
            })),
            days: toStrings("day/@ref", page),
            links: toNodes("link", page).map(link => ({
               book: toString("@book", link),
               edition: toString("@edition", link),
               id: toString("@id", link),
            })),
            verses: toNodes("verses/verse", page).map(verse => ({
               isDeleted: toBoolean("@deleted", verse),
               nodes: getLines("line|repeat", verse as Node),
            })),
            refrain: toNode("verses/refrain", page)
               ? {
                    isDeleted: toBoolean("verses/refrain/@deleted", page),
                    nodes: getLines(
                       "verses/refrain/line|verses/refrain/repeat",
                       page as Node
                    ),
                 }
               : null,
            chorus: toNode("verses/chorus", page)
               ? {
                    isDeleted: toBoolean("verses/chorus/@deleted", page),
                    nodes: getLines(
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
   toNodes(selector, verse).map(lineOrRepeat => {
      if ((lineOrRepeat as Node).nodeName === "repeat") {
         return {
            kind: "repeat",
            times: Number(toString("@times", lineOrRepeat) || "2"),
            lines: toNodes("line", lineOrRepeat).map(line => ({
               kind: "line",
               text: (line as Node).textContent ?? "",
            })),
            // lines: toNodes("line", lineOrRepeat).map(
            //    line => (line as Node).textContent ?? ""
            // ),
            before: toString("@before", lineOrRepeat),
            after: toString("@after", lineOrRepeat),
         };
      }
      // return (lineOrRepeat as Node).textContent ?? "";
      return {
         kind: "line",
         text: (lineOrRepeat as Node).textContent ?? "",
      };
   });
