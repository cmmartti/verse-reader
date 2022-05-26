import React from "react";

import * as types from "../types";
import { Hymn } from "./Hymn";
import { useCurrentPage } from "../util/useCurrentPage";
import { useVisibleRange } from "../util/useVisibleRange";
import { useAppState } from "../state";

export function Book({ book }: { book: types.HymnalDocument }) {
    let locs = React.useMemo(
        () => Object.values(book.hymns).map(hymn => hymn.id),
        [book]
    );

    let defaultLoc = locs[0] ?? null;
    let [currentLoc, setCurrentLoc] = useAppState(`book/${book.id}/loc`, defaultLoc);

    // If the current location is invalid, reset to the default location
    let locIsInvalid = currentLoc && !locs.includes(currentLoc);
    if (locIsInvalid) currentLoc = defaultLoc;
    React.useEffect(() => {
        if (locIsInvalid) setCurrentLoc(defaultLoc);
    }, [locIsInvalid, setCurrentLoc, defaultLoc]);

    let scrollerRef = React.useRef<HTMLUListElement>(null!);

    // Unload the contents of off-screen pages to improve scrolling performance
    let visiblePages = useVisibleRange({
        initialPage: currentLoc ?? "",
        keys: locs,
        overscan: 3,
        ref: scrollerRef,
    });

    // Track which page(s) are currently on-screen, and which is the "current" one
    useCurrentPage({
        initialPage: currentLoc,
        keys: locs,
        ref: scrollerRef,
        onChange: setCurrentLoc,
    });

    return (
        <>
            <h1 className="title">{book.title}</h1>
            <ul className="Book" ref={scrollerRef} tabIndex={-1}>
                {locs.map(loc => (
                    <li key={loc} id={loc} tabIndex={-1}>
                        {visiblePages.includes(loc) ? (
                            <Hymn hymn={book.hymns[loc]!} document={book} />
                        ) : null}
                    </li>
                ))}
            </ul>
        </>
    );
}
