import React from "react";

import * as types from "../types";
import { Hymn } from "./Hymn";
import { useLocationState } from "../locationState";
import { useAppState } from "../state";

export function Page({ book }: { book: types.Hymnal }) {
    let locs = React.useMemo(
        () => Object.values(book.pages).map(page => page.id),
        [book]
    );

    let [lastLoc, setLastLoc] = useAppState(`book/${book.id}/lastLoc`, null);

    let defaultLoc = locs[0]!;

    let [currentLoc, setCurrentLoc] = useLocationState(
        `book/${book.id}/loc`,
        lastLoc ?? defaultLoc
    );

    let locRef = React.useRef(currentLoc!);
    React.useEffect(() => {
        locRef.current = currentLoc!;
    });

    let setLoc = React.useCallback(
        (loc: string) => {
            setCurrentLoc(loc);
            setLastLoc(loc);
        },
        [setCurrentLoc, setLastLoc]
    );

    let next = React.useCallback(() => {
        let currentIndex = locs.findIndex(loc => loc === currentLoc);
        setLoc(locs[Math.min(locs.length - 1, currentIndex + 1)]!);
    }, [currentLoc, locs, setLoc]);

    let previous = React.useCallback(() => {
        let currentIndex = locs.findIndex(loc => loc === currentLoc);
        setLoc(locs[Math.max(0, currentIndex - 1)]!);
    }, [currentLoc, locs, setLoc]);

    // If the current location is invalid, reset to the default location
    let locIsInvalid = currentLoc && !locs.includes(currentLoc);
    if (locIsInvalid) currentLoc = defaultLoc;
    React.useEffect(() => {
        if (locIsInvalid) setLoc(defaultLoc);
    }, [locIsInvalid, setLoc, defaultLoc]);

    let pageRef = React.useRef<HTMLDivElement>(null!);

    React.useEffect(() => {
        let page = pageRef.current;

        let startTouch: Touch;
        let waitingForSecondTap = false;

        function touchStartHandler(event: TouchEvent) {
            if (event.touches.length === 1) {
                startTouch = event.touches[0]!;
                page.addEventListener("touchend", touchEndHandler);
            }
        }

        function touchEndHandler(event: TouchEvent) {
            if (event.changedTouches.length === 1) {
                let endTouch = event.changedTouches[0]!;

                if (
                    Math.abs(startTouch.clientX - endTouch.clientX) < 3 &&
                    Math.abs(startTouch.clientY - endTouch.clientY) < 3
                ) {
                    let ratio = startTouch.clientX / page.clientWidth;

                    // Left side
                    if (ratio <= 0.33) {
                        // event.preventDefault();
                        previous();
                    }

                    // Right side
                    else if (ratio >= 0.66) {
                        // event.preventDefault();
                        next();
                    }

                    // Middle
                    else {
                        if (!waitingForSecondTap) {
                            waitingForSecondTap = true;
                            setTimeout(() => {
                                waitingForSecondTap = false;
                            }, 300);
                        } else {
                            toggleFullscreen(document.body);
                            event.preventDefault();
                        }
                    }

                    page.removeEventListener("touchend", touchEndHandler);
                }
            }
        }

        page.addEventListener("touchstart", touchStartHandler);
        return () => {
            page.removeEventListener("touchstart", touchStartHandler);
            page.removeEventListener("touchend", touchEndHandler);
        };
    }, [next, previous]);

    React.useEffect(() => {
        let page = pageRef.current;
        let fn = (event: KeyboardEvent) => {
            switch (event.key) {
                case "ArrowRight":
                    event.preventDefault();
                    next();
                    break;
                case "ArrowLeft":
                    event.preventDefault();
                    previous();
                    break;
            }
        };
        page.addEventListener("keydown", fn);
        return () => page.removeEventListener("keydown", fn);
    }, [next, previous]);

    let scrollPositions = React.useRef(new Map<string, number>());

    React.useEffect(() => {
        let container = pageRef.current;
        let fn = () => {
            let position = container.scrollTop / container.clientHeight;
            scrollPositions.current.set(locRef.current, position);
        };
        container.addEventListener("scroll", fn);
        return () => container.removeEventListener("scroll", fn);
    }, []);

    React.useLayoutEffect(() => {
        pageRef.current.scrollTop =
            (scrollPositions.current.get(currentLoc!) ?? 0) *
            pageRef.current.clientHeight;
    }, [currentLoc]);

    return (
        <div tabIndex={-1} ref={pageRef} style={{ overflow: "auto" }}>
            <Hymn hymn={book.pages[currentLoc!]!} book={book} />
        </div>
    );
}

function toggleFullscreen(element: Element) {
    if (!document.fullscreenElement)
        element.requestFullscreen({ navigationUI: "show" }).catch(err => {
            console.error(
                `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
            );
        });
    else if (document.fullscreenElement) document.exitFullscreen();
}
