import lunr, { Builder, Pipeline, PipelineFunction } from "lunr";

import * as types from "./types";

// Do not delete
let limitLength: PipelineFunction = token =>
    token.toString().length <= 2 ? null : token;
Pipeline.registerFunction(limitLength, "limitLength");

let stripPunctuation: PipelineFunction = token =>
    token.update(term => term.replaceAll(/[“”’'".,;:?!\-—–+^0-9]/g, ""));
Pipeline.registerFunction(stripPunctuation, "stripPunctuation");

export function buildIndex(book: types.Hymnal) {
    let builder = new Builder();
    builder.ref("id");
    builder.field("line");

    builder.pipeline.add(stripPunctuation);
    builder.searchPipeline.add(stripPunctuation);

    // Add each line of each verse of each hymn to the search index.
    // Label each line with a decipherable reference ID.
    Object.values(book.pages).forEach(page => {
        page.verses.forEach((verse, verseIndex) => {
            extractLines(verse).forEach((line, lineIndex) =>
                builder.add({ id: `${page.id}/${verseIndex}/${lineIndex}`, line: line })
            );
        });
        if (page.refrain)
            extractLines(page.refrain).forEach((line, lineIndex) =>
                builder.add({ id: `${page.id}/r/${lineIndex}`, line: line })
            );
        if (page.chorus)
            extractLines(page.chorus).forEach((line, lineIndex) =>
                builder.add({ id: `${page.id}/c/${lineIndex}`, line: line })
            );
    }, builder);

    return builder.build();
}

export function searchIndex(
    indexOfLines: lunr.Index,
    book: types.Hymnal,
    search: string[]
) {
    // Get a list of lines that match the search terms
    let results = indexOfLines.query(query => {
        query.term(search, {
            fields: ["line"],
            presence: lunr.Query.presence.REQUIRED,
            wildcard: lunr.Query.wildcard.TRAILING,
        });
    });

    let linesByPage = {} as Record<string, string[]>;

    for (let result of results) {
        // Break apart the ref string into its component parts
        let [pageId, verseId, lineId] = result.ref.split("/");

        // Skip this result if the ref is invalid for some reason
        if (!pageId || !verseId || !lineId) break;

        let page = book.pages[pageId];
        if (!page) break;

        // Get all lines for this verse
        let verseLines: string[] = [];
        if (verseId === "r" && page.refrain) verseLines = extractLines(page.refrain);
        else if (verseId === "c" && page.chorus) verseLines = extractLines(page.chorus);
        else {
            let verse = page.verses[parseInt(verseId, 10)];
            if (verse) verseLines = extractLines(verse);
        }

        // Extract the matching line
        let line = verseLines[parseInt(lineId, 10)] ?? `?? ${result.ref.split}`;

        // Initialize this page's results list if it doesn't exist yet
        let resultsList = linesByPage[pageId] ?? [];
        linesByPage[pageId] = resultsList;

        resultsList.push(line);
    }

    return Object.entries(linesByPage).map(([id, lines]) => ({ id, lines }));
}

function extractLines(verse: types.Verse) {
    return verse.lines.flatMap(lineOrRepeat => {
        if (lineOrRepeat.kind === "repeat")
            return lineOrRepeat.lines.map(line => line.text);
        return lineOrRepeat.text;
    });
}
