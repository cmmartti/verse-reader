import lunr from "lunr";

import * as types from "./types";

let stripPunctuation: lunr.PipelineFunction = token =>
   token.update(term => term.replaceAll(/[“”’'".,;:?!\-—–+^0-9]/g, ""));

lunr.Pipeline.registerFunction(stripPunctuation, "stripPunctuation");

let extractLines = (verse: types.Verse) =>
   verse.nodes.flatMap(lineOrRepeat =>
      lineOrRepeat.kind === "line"
         ? lineOrRepeat.text
         : lineOrRepeat.lines.map(line => line.text)
   );

export function buildIndex(book: types.Hymnal) {
   let builder = new lunr.Builder();
   builder.ref("id");
   builder.field("line");

   builder.pipeline.add(stripPunctuation);
   builder.searchPipeline.add(stripPunctuation);

   // Add each line of each verse of each hymn to the search index.
   // Label each line with a decipherable reference ID.
   for (let hymn of Object.values(book.pages)) {
      hymn.verses.forEach((verse, verseIndex) => {
         extractLines(verse).forEach((line, i) =>
            builder.add({ id: `${hymn.id}/${verseIndex}/${i}`, line })
         );
      });
      if (hymn.refrain)
         extractLines(hymn.refrain).forEach((line, i) =>
            builder.add({ id: `${hymn.id}/r/${i}`, line })
         );
      if (hymn.chorus)
         extractLines(hymn.chorus).forEach((line, i) =>
            builder.add({ id: `${hymn.id}/c/${i}`, line })
         );
   }

   return builder.build();
}

export function searchIndex(
   indexOfLines: lunr.Index,
   book: types.Hymnal,
   search: string[]
) {
   // Get a list of lines that match the search terms
   let results = indexOfLines.query(query => {
      query.term(
         search.map(str => str.toLowerCase()),
         {
            fields: ["line"],
            presence: lunr.Query.presence.REQUIRED,
            wildcard: lunr.Query.wildcard.TRAILING,
         }
      );
   });

   let linesByPage = {} as Record<string, string[]>;

   for (let result of results) {
      // Break apart the ref string into its component parts to find which hymn and
      // verse this line belongs to
      let [hymnId, verseId, lineId] = result.ref.split("/");

      // Skip this result if the ref string is invalid for some reason
      if (!hymnId || !verseId || !lineId) break;

      let page = book.pages[hymnId];
      if (!page) break;

      // Extract the matching line from this verse
      let verseLines: string[] = [];
      if (verseId === "r" && page.refrain) verseLines = extractLines(page.refrain);
      else if (verseId === "c" && page.chorus) verseLines = extractLines(page.chorus);
      else {
         let verse = page.verses[Number(verseId)];
         if (verse) verseLines = extractLines(verse);
      }
      let line = verseLines[Number(lineId)] ?? `?? ${result.ref.split}`;

      // Initialize this hymn's results list if it doesn't exist yet
      let resultsList = linesByPage[hymnId] ?? [];
      linesByPage[hymnId] = resultsList;

      resultsList.push(line);
   }

   return Object.entries(linesByPage).map(([id, lines]) => ({ id, lines }));
}
