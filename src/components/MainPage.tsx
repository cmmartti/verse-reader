import React from "react";
import { useVirtual } from "react-virtual";
import { useMatch, useNavigate } from "@tanstack/react-location";

import { Toolbar } from "./Toolbar";
import { useDebounceCallback } from "../util/useDebounceCallback";
import { useViewportWidth } from "../util/useViewportWidth";
import { Hymn } from "./Hymn";
import { setLastPosition } from "../db";
import { toggleFullscreen } from "../util/toggleFullscreen";
import { useCSSVar } from "../util/useCSSVar";
import { LocationGenerics } from "./App";

const HYMN_WIDTH_PREFERRED = 560;
const HYMN_HEIGHT_PREFERRED = 500;
const HYMN_SPACING = 1;

export function MainPage() {
    let {
        data,
        params: { position: urlPosition },
    } = useMatch<LocationGenerics>();
    let document = data.document!;
    let metadata = data.metadata!;

    let hymnList = React.useMemo(() => Object.values(document.hymns), [document]);

    let mainRef = React.useRef<HTMLDivElement>(null!);

    // Increase scrolling performance by limiting total DOM elements,
    // using a virtualizer to only keep a few pages in memory at a time.
    let [viewportWidth, viewportHeight] = useViewportWidth(
        mainRef,
        HYMN_WIDTH_PREFERRED
    );

    let mobileMode =
        viewportHeight < HYMN_HEIGHT_PREFERRED || viewportWidth < HYMN_WIDTH_PREFERRED;
    useCSSVar("--scroll-snap-type", mobileMode ? "x mandatory" : "none");

    let { scrollToIndex, ...virtualizer } = useVirtual({
        size: hymnList.length,
        parentRef: mainRef,
        horizontal: true,
        paddingEnd: viewportWidth - Math.min(HYMN_WIDTH_PREFERRED, viewportWidth),
        estimateSize: React.useCallback(
            () => (mobileMode ? viewportWidth : HYMN_WIDTH_PREFERRED) + HYMN_SPACING,
            [viewportWidth, mobileMode]
        ),
        overscan: 3,
    });

    let navigate = useNavigate();

    /**
     * Saves the current position to the browser (URL and localStorage).
     * This function is debounced to avoid overloading the browser with
     * frequent URL updates.
     */
    let persistPosition = useDebounceCallback(
        React.useCallback(
            (newPosition: string, replace: true | false) => {
                navigate({ to: `/${document.id}/${newPosition}`, replace });
                setLastPosition(document.id, newPosition);
            },
            [document.id, navigate]
        ),
        200
    );

    let initialPosition = React.useMemo(() => {
        if (urlPosition && urlPosition in document.hymns) {
            return urlPosition;
        }
        if (metadata.lastPosition && metadata.lastPosition in document.hymns) {
            return metadata.lastPosition;
        }
        return null;
    }, [metadata, document, urlPosition]);

    let [position, _setPosition] = React.useState<string | null>(initialPosition);
    let positionRef = React.useRef<string | null>(null);

    let setPosition = React.useCallback(
        ({
            id,
            replace,
            persist,
        }: {
            id: string;
            replace: true | false;
            persist: true | false;
        }) => {
            if (positionRef.current !== id) {
                _setPosition(id);
                if (persist) persistPosition(id, replace);
                positionRef.current = id;
            }
        },
        [persistPosition]
    );

    /**
     * The current position (and in turn, the URL) can be updated from either direction:
     *  1. Via the user interface
     *  2. Externally, by editing the URL or using the browser's back button
     *
     * To handle case 2, whenever `initialPosition` changes, compare it to
     * the position stored in `positionRef`. `positionRef` is updated in
     * sync with the `position` state variable, so if the values drift,
     * it means the URL was updated externally and the user interface should
     * be updated to match. We must be discriminatory to avoid a feedback loop.
     * Must be synchronous (useLayoutEffect) to avoid flashing page 1.
     */
    React.useLayoutEffect(() => {
        if (initialPosition && positionRef.current !== initialPosition) {
            scrollToIndex(
                hymnList.findIndex(hymn => hymn.id === initialPosition),
                { align: "start" }
            );
            setPosition({ id: initialPosition, replace: false, persist: false });
        }
    }, [hymnList, scrollToIndex, initialPosition, setPosition]);

    // Update the current position when scrolling occurs
    let observer = React.useRef<IntersectionObserver | null>(null);
    React.useEffect(() => {
        // Keep a list of all intersection ratios.
        let ratios: { [id: string]: number } = {};

        // Then whenever a threshold is crossed...
        observer.current = new IntersectionObserver(
            entries => {
                // update the above list,
                entries.forEach(entry => {
                    let id = entry.target.getAttribute("data-id")!;
                    ratios[id] = entry.intersectionRatio;
                });

                // find the first page that has the highest intersection ratio,
                let activePage = Object.entries(ratios)
                    .map(([id, ratio]) => ({ id, ratio }))
                    .reduce((prev, cur) => (cur.ratio > prev.ratio ? cur : prev));

                // and set it as the current page.
                if (activePage)
                    setPosition({ id: activePage.id, replace: true, persist: true });
            },
            { threshold: [0, 0.5, 1], root: mainRef.current }
        );

        return () => observer.current!.disconnect();
    }, [setPosition]);

    let observeElement = React.useCallback(element => {
        if (observer.current && element) observer.current.observe(element);
    }, []);

    return (
        <main className="MainPage" ref={mainRef}>
            <h1 className="MainPage-title" onClick={() => toggleFullscreen(mainRef)}>
                {document.title}
            </h1>

            <Toolbar
                page={position}
                setPage={(id: string) => {
                    scrollToIndex(
                        hymnList.findIndex(hymn => hymn.id === id),
                        { align: "start" }
                    );
                    setPosition({ id, replace: false, persist: true });
                }}
                document={document}
                index={data.index!}
                documents={data.documents!}
                toggleFullscreen={() => toggleFullscreen(mainRef)}
            />

            <div
                className="Document"
                style={{
                    width: `${virtualizer.totalSize}px`,
                    position: "relative",
                }}
            >
                {virtualizer.virtualItems.map(virtualColumn => {
                    let hymn = hymnList[virtualColumn.index];

                    return (
                        <div
                            className="HymnWrapper"
                            key={hymn.id}
                            data-id={hymn.id}
                            ref={observeElement}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                width: virtualColumn.size - HYMN_SPACING,
                                transform: `translateX(${virtualColumn.start}px)`,
                            }}
                        >
                            <Hymn hymn={hymn} document={document} />
                        </div>
                    );
                })}
            </div>
        </main>
    );
}
