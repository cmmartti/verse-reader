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

    React.useEffect(() => {
        let startTouch: Touch;

        function touchStartHandler(event: TouchEvent) {
            if (event.touches.length === 1) {
                startTouch = event.touches[0]!;
                scroller.addEventListener("touchend", touchEndHandler);
            }
        }

        function touchEndHandler(event: TouchEvent) {
            if (event.changedTouches.length === 1) {
                let endTouch = event.changedTouches[0]!;

                if (
                    startTouch.clientX === endTouch.clientX &&
                    startTouch.clientY === endTouch.clientY
                ) {
                    // console.log(scroller)
                    let ratio = startTouch.clientX / scroller.clientWidth;
                    if (ratio <= 0.33) {
                        console.log("left");
                        event.preventDefault();
                    } else if (ratio > 0.33 && ratio < 0.66) {
                        console.log("middle");
                    } else if (ratio >= 0.33) {
                        console.log("right");
                        event.preventDefault();
                    } else {
                        console.log("??");
                    }
                    scroller.removeEventListener("touchend", touchEndHandler);
                }
            }
        }

        let scroller = scrollerRef.current;
        scroller.addEventListener("touchstart", touchStartHandler);
        return () => {
            scroller.removeEventListener("touchstart", touchStartHandler);
            scroller.removeEventListener("touchend", touchEndHandler);
        };
    }, []);

    return (
        <div className="Book" ref={scrollerRef} tabIndex={-1}>
            {locs.map(loc => (
                <div
                    key={loc}
                    data-page={loc}
                    tabIndex={-1}
                    // data-visible={visiblePages.includes(loc) ? "" : null}
                >
                    {visiblePages.includes(loc) ? (
                        <Hymn hymn={book.pages[loc]!} book={book} />
                    ) : null}
                </div>
            ))}
        </div>
    );
}
