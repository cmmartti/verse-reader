import React from "react";

import { HymnalDocument } from "../types";
import { useDebounceCallback } from "../util/useDebounceCallback";
import { searchIndex } from "../buildIndex";
import { rebuildIndex } from "../db";

type Result = { id: string; lines: string[] };

const DEBOUNCE_WAIT = 100;

export function SearchDialog({
    document,
    index,
}: {
    document: HymnalDocument;
    index: lunr.Index;
}) {
    let [inputValue, setInputValue] = React.useState("");
    let [results, setResults] = React.useState([] as Result[]);

    let updateResults = useDebounceCallback(
        React.useCallback(
            (search: string) => {
                if (index) setResults(searchIndex(index, document, search));
            },
            [index, document]
        ),
        DEBOUNCE_WAIT
    );

    let [isLoading, setIsLoading] = React.useState(false);

    return (
        <div className="SearchDialog">
            <div className="SearchDialog-controls">
                <input
                    autoFocus
                    type="search"
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value);
                        updateResults(e.target.value);
                    }}
                />
                <button
                    className="Button"
                    onClick={async () => {
                        setIsLoading(true);
                        index = await rebuildIndex(document.id);
                        setIsLoading(false);
                    }}
                    disabled={isLoading}
                >
                    Rebuild search index
                </button>
            </div>
            <div className="SearchDialog-results">
                <p>
                    {results.length} result{results.length !== 1 && "s"}
                </p>
                <ul className="SearchDialog-hymnList">
                    {results.map(result => {
                        let hymn = document.hymns[result.id];
                        return (
                            <li key={hymn.id}>
                                <div>
                                    {hymn.id}: {hymn.title}
                                </div>
                                <ul>
                                    {result.lines.map((line, i) => (
                                        <li key={i}>{line}</li>
                                    ))}
                                </ul>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

// type HymnResult = {
//     id: string;
//     matches: string[];
// };

// function filterHymns(document: HymnalDocument, search: string) {
//     let results: HymnResult[] = [];
//     let lowerCasedSearch = search.toLowerCase();
//     for (let hymn of Object.values(document.hymns)) {
//         let matches: Array<string | string[]> = [];
//         for (let verse of hymn.verses) {
//             matches.push(searchVerse(verse, lowerCasedSearch));
//         }
//         if (hymn.refrain) {
//             matches.push(searchVerse(hymn.refrain, search));
//         }
//         if (hymn.chorus) {
//             matches.push(searchVerse(hymn.chorus, search));
//         }
//         let flatMatches = matches.flat();
//         if (flatMatches.length > 0) {
//             results.push({ id: hymn.id, matches: flatMatches });
//         }
//     }

//     return results;
// }

// function searchVerse(verse: Verse, lowerCasedSearch: string) {
//     let matches: string[] = [];
//     for (let lineOrRepeat of verse.lines) {
//         if (lineOrRepeat.kind === "line") {
//             if (lineOrRepeat.text.toLowerCase().includes(lowerCasedSearch))
//                 matches.push(lineOrRepeat.text);
//         } else if (lineOrRepeat.kind === "repeat") {
//             for (let line of lineOrRepeat.lines) {
//                 if (line.text.toLowerCase().includes(lowerCasedSearch))
//                     matches.push(line.text);
//             }
//         }
//     }
//     return matches;
// }
