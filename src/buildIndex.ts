import lunr, { Builder, Pipeline, PipelineFunction } from "lunr";

import { HymnalDocument, Verse } from "./types";

let limitLength: PipelineFunction = token =>
    token.toString().length <= 2 ? null : token;
Pipeline.registerFunction(limitLength, "limitLength");

let stripPunctuation: PipelineFunction = token =>
    token.update(term => term.replaceAll(/[“”’'".,;:?!\-—–+^0-9]/g, ""));
Pipeline.registerFunction(stripPunctuation, "stripPunctuation");

export function buildIndex(document: HymnalDocument) {
    let builder = new Builder();
    builder.ref("id");
    builder.field("line");

    // builder.pipeline.add(limitLength);
    builder.pipeline.add(stripPunctuation);
    builder.searchPipeline.add(stripPunctuation);

    Object.values(document.hymns).forEach(hymn => {
        hymn.verses.forEach((verse, verseIndex) => {
            extractLines(verse).forEach((line, lineIndex) =>
                builder.add({
                    id: `${hymn.id}/${verseIndex}/${lineIndex}`,
                    line: line,
                })
            );
        });
        if (hymn.refrain)
            extractLines(hymn.refrain).forEach((line, lineIndex) =>
                builder.add({
                    id: `${hymn.id}/r/${lineIndex}`,
                    line: line,
                })
            );
        if (hymn.chorus)
            extractLines(hymn.chorus).forEach((line, lineIndex) =>
                builder.add({
                    id: `${hymn.id}/c/${lineIndex}`,
                    line: line,
                })
            );
    }, builder);

    return builder.build();
}

export function searchIndex(
    index: lunr.Index,
    document: HymnalDocument,
    search: string
) {
    if (!search) return [];

    let results = index.query(query => {
        query.term(search.trim().split(" "), {
            fields: ["line"],
            presence: lunr.Query.presence.REQUIRED,
            wildcard: lunr.Query.wildcard.TRAILING,
        });
    });

    let resultsByHymn: {
        [id: string]: {
            id: string;
            lines: string[];
        };
    } = {};

    for (let result of results) {
        let [hymnId = null, verseId = null, lineId = null] = result.ref.split("/");

        if (hymnId && verseId && lineId) {
            let lineIndex = parseInt(lineId, 10);
            let hymn = document.hymns[hymnId];

            if (hymn) {
                let lines: string[] = [];
                if (verseId === "r" && hymn.refrain) {
                    lines = extractLines(hymn.refrain);
                } else if (verseId === "c" && hymn.chorus) {
                    lines = extractLines(hymn.chorus);
                } else {
                    let verseIndex = parseInt(verseId, 10);
                    if (hymn.verses[verseIndex]) {
                        let verse = hymn.verses[verseIndex];
                        if (verse) lines = extractLines(verse);
                    } else console.error(result);
                }

                if (!resultsByHymn[hymnId]) {
                    resultsByHymn[hymnId] = { id: hymnId, lines: [] };
                }

                resultsByHymn[hymnId] = {
                    id: hymnId,
                    lines: [...resultsByHymn[hymnId]!.lines, lines[lineIndex]!],
                };
            }
        }
    }

    return Object.values(resultsByHymn);
}

function extractLines(verse: Verse) {
    let lines: string[] = [];
    verse.lines.forEach(lineOrRepeat => {
        switch (lineOrRepeat.kind) {
            case "line":
                lines.push(lineOrRepeat.text);
                break;
            case "repeat":
                lineOrRepeat.lines.forEach(line => lines.push(line.text));
                break;
        }
    });
    return lines;
}
