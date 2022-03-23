import React from "react";

import * as types from "../types";
import { Dialog } from "./Dialog";
import { rebuildIndex } from "../db";
import { searchIndex } from "../buildIndex";
import { useDebounceCallback } from "../util/useDebounceCallback";

type Result = { id: string; lines: string[] };

const DEBOUNCE_WAIT = 100;

export function SearchDialog({
    document,
    index,
}: {
    document: types.HymnalDocument;
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
        <Dialog id="search-dialog" title="Search" className="SearchDialog">
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
        </Dialog>
    );
}
