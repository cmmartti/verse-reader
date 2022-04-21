import React from "react";
// import OnDemandLiveRegion from "on-demand-live-region";

import * as types from "../../types";
import { searchIndex } from "../../buildIndex";
import { useDebounceCallback } from "../../util/useDebounceCallback";
import { Link } from "@tanstack/react-location";

import useLoader from "../../util/useLoader";
import { getIndex } from "../../db";

type Result = { id: string; lines: string[] };

const DEBOUNCE_WAIT = 150;

export function SearchPanel({
    document,
    position,
}: {
    document: types.HymnalDocument;
    position: types.HymnId;
}) {
    let [inputValue, setInputValue] = React.useState("");
    let [results, setResults] = React.useState([] as Result[]);

    let indexLoader = useLoader(
        React.useCallback(() => getIndex(document.id), [document.id]),
        { pendingMs: 100, pendingMinMs: 500 }
    );

    let updateResults = useDebounceCallback(
        React.useCallback(
            (search: string) => {
                if (indexLoader.ready && search.length >= 3) {
                    setResults(searchIndex(indexLoader.value, document, search));
                } else setResults([]);
            },
            [document, indexLoader]
        ),
        DEBOUNCE_WAIT
    );

    // let liveRegionRef = React.useRef(new OnDemandLiveRegion());
    React.useEffect(() => {
        // liveRegionRef.current.say(
        //     `${results.length} result${results.length !== 1 && "s"} available`
        // );
    }, [results]);

    return (
        <div className="SearchPanel">
            <div className="controls">
                <label htmlFor="search-input" className="visually-hidden">
                    search
                </label>
                <input
                    id="search-input"
                    type="search"
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value);
                        updateResults(e.target.value);
                    }}
                    placeholder="Search"
                    onFocus={e => e.target.select()}
                />
            </div>

            <ul className="results">
                {results.map(result => {
                    let hymn = document.hymns[result.id];

                    return (
                        <li key={hymn.id} className="result">
                            <h2>
                                <b>
                                    {hymn.isRestricted && "*"}
                                    {hymn.id}:
                                </b>{" "}
                                <Link to={`/${document.id}/${hymn.id}`}>
                                    {hymn.title}
                                </Link>
                            </h2>
                            <ul className="result-lines">
                                {result.lines.map((line, i) => (
                                    <li key={i} className="result-line">
                                        {line}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
