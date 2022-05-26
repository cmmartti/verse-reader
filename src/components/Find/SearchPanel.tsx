import React from "react";
import * as idb from "idb-keyval";
import * as lunr from "lunr";

import * as types from "../../types";
import { buildIndex, searchIndex } from "../../buildIndex";
import { useDebounceCallback } from "../../util/useDebounceCallback";
import { ReactComponent as SearchOffIcon } from "../../icons/search_off.svg";
import { useLoader } from "../../util/useLoader";
import c from "../../util/c";
import { useAppState } from "../../state";

export function SearchPanel({ book }: { book: types.HymnalDocument }) {
    let [search, setSearch] = useAppState(`book/${book.id}/search`, "");

    let [inputValue, _setInputValue] = React.useState(search);
    let [results, setResults] = React.useState([] as { id: string; lines: string[] }[]);

    let setInputValue = React.useCallback(
        (search: string) => {
            _setInputValue(search);
            setSearch(search);
        },
        [setSearch]
    );

    let indexLoader = useLoader({
        key: `book/${book.id}/searchIndex`,
        loader: React.useCallback(async () => {
            if (book === null) return null;

            let response = await idb.get<object>(`book/${book.id}/searchIndex`);
            if (response === undefined) {
                let searchIndex = buildIndex(book);
                idb.set(`book/${book.id}/searchIndex`, searchIndex.toJSON());
                return searchIndex;
            } else return lunr.Index.load(response);
        }, [book]),
        pendingMs: 100,
        pendingMinMs: 500,
    });

    let updateResults = useDebounceCallback(
        React.useCallback(
            (search: string) => {
                if (
                    indexLoader.mode === "success" &&
                    indexLoader.value !== null &&
                    book !== null
                ) {
                    setResults(searchIndex(indexLoader.value, book, search));
                }
            },
            [book, indexLoader]
        ),
        150 // wait 150ms after typing to prevent stuttering and lagging
    );

    React.useEffect(() => {
        if (inputValue.length >= 3) {
            updateResults(inputValue);
        } else setResults([]);
    }, [inputValue, updateResults]);

    let inputRef = React.useRef<HTMLInputElement>(null!);
    let listRef = React.useRef<HTMLUListElement>(null!);

    return (
        <div className="SearchPanel">
            <div className="controls">
                <input
                    ref={inputRef}
                    aria-label="search"
                    type="search"
                    value={inputValue}
                    onChange={event => setInputValue(event.target.value)}
                    placeholder="Search"
                    onFocus={e => e.target.select()}
                    autoComplete="off"
                    onKeyUp={event => {
                        if (event.key === "Enter" && results.length > 0) {
                            listRef.current.focus();
                        }
                    }}
                />
                <button
                    className="Button"
                    aria-label="clear search"
                    title="Clear Search"
                    disabled={inputValue.length === 0}
                    onClick={() => {
                        setInputValue("");
                        inputRef.current.focus();
                    }}
                    // On touch, don't move the focus when tapping the clear button.
                    // This is to prevent the keyboard from popping up or down unexpectedly
                    onTouchEnd={event => {
                        event.preventDefault();
                        setInputValue("");
                    }}
                >
                    <SearchOffIcon />
                </button>
            </div>

            <div className="results">
                {inputValue.length >= 3 ? (
                    <p className="results-count" aria-live="polite">
                        {results.length + " result" + (results.length !== 1 ? "s" : "")}
                    </p>
                ) : null}

                {inputValue.length > 0 && inputValue.length < 3 ? (
                    <p className="results-count" aria-live="polite">
                        (Type at least 3 letters)
                    </p>
                ) : null}

                <ul className="results-list" tabIndex={-1} ref={listRef}>
                    {indexLoader.mode === "loading" && <li>Loading search index...</li>}
                    {results.map(result => (
                        <Result
                            book={book!}
                            key={result.id}
                            id={result.id}
                            lines={result.lines}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}

function Result({
    book,
    id,
    lines,
}: {
    book: types.HymnalDocument;
    id: types.HymnId;
    lines: string[];
}) {
    let [loc, setLoc] = useAppState(`book/${book.id}/loc`);
    let hymn = book.hymns[id];
    if (hymn === undefined) return null;

    let hymnId = hymn.id;
    return (
        <li
            className={
                "result" +
                c("is-current", loc === hymn.id) +
                c("is-deleted", hymn.isDeleted)
            }
        >
            <div className="result-id">
                {hymn.isRestricted && <span aria-label="restricted">*</span>}
                {hymn.id}
            </div>

            <a
                href={`/${book.id}?loc=${hymn.id}`}
                className="result-title"
                onClick={event => {
                    event.preventDefault();
                    setLoc(hymnId);
                }}
            >
                {hymn.title || "(no title)"}
            </a>

            <ul className="result-lines">
                {lines.map((line, i) => (
                    <li key={i}>{line}</li>
                ))}
            </ul>
        </li>
    );
}
