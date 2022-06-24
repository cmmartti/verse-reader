import React from "react";

import * as types from "../types";
import { Hymn } from "./Hymn";
import { useCurrentPage } from "../util/useCurrentPage";
import { useVisibleRange } from "../util/useVisibleRange";
import { useAppState } from "../state";

let getKey = (element: HTMLElement) => element.getAttribute("data-page")!;

export function Book({ book }: { book: types.Hymnal }) {
    let locs = React.useMemo(
        () => Object.values(book.pages).map(page => page.id),
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

    let scrollerRef = React.useRef<HTMLDivElement>(null!);

    // Unload the contents of off-screen pages to improve scrolling performance
    let visiblePages = useVisibleRange({
        initialPage: currentLoc ?? "",
        keys: locs,
        overscan: 3,
        ref: scrollerRef,
        getKey,
    });

    // Track which page(s) are currently on-screen, and which is the "current" one
    useCurrentPage({
        initialPage: currentLoc,
        keys: locs,
        ref: scrollerRef,
        onChange: setCurrentLoc,
        getKey,
    });

    return (
        <div className="Book" ref={scrollerRef} tabIndex={-1}>
            {locs.map(loc => (
                <div
                    key={loc}
                    data-page={loc}
                    tabIndex={-1}
                    // aria-hidden={currentLoc !== loc}
                >
                    {visiblePages.includes(loc) ? (
                        <Hymn hymn={book.pages[loc]!} book={book} />
                    ) : null}
                </div>
            ))}
        </div>
    );
}
