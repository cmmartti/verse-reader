import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVirtual } from "react-virtual";

import { Toolbar } from "./Toolbar";
import { useDebounceCallback } from "../util/useDebounceCallback";
import { useViewportWidth } from "../util/useViewportWidth";
import { Hymn } from "./Hymn";
import { getDocumentData, setLastPosition } from "../util/documentRepository";

const HYMN_WIDTH_DEFAULT = 560;
const HYMN_SPACING = 1;

export function MainPage({
    id,
    lastPosition,
}: {
    id: string;
    lastPosition: string | null;
}) {
    const { position: urlPosition } = useParams();

    const document = React.useMemo(() => getDocumentData(id).unwrap(), [id]);
    const hymnList = React.useMemo(() => Object.values(document.hymns), [document]);


    const mainRef = React.useRef<HTMLDivElement>(null!);

    // Increase scrolling performance by limiting total DOM elements,
    // using a virtualizer to only keep a few pages in memory at a time.
    const viewportWidth = useViewportWidth(mainRef, HYMN_WIDTH_DEFAULT);
    const { scrollToIndex, ...virtualizer } = useVirtual({
        size: hymnList.length,
        parentRef: mainRef,
        horizontal: true,
        paddingEnd: viewportWidth - Math.min(HYMN_WIDTH_DEFAULT, viewportWidth),
        estimateSize: React.useCallback(
            () => Math.min(HYMN_WIDTH_DEFAULT, viewportWidth) + HYMN_SPACING,
            [viewportWidth]
        ),
        overscan: 1,
        // keyExtractor: index => document.id + "/" + hymnList[index].id,
    });

    const navigate = useNavigate();

    /**
     * Saves the current position to the browser (URL and localStorage).
     * This function is debounced to avoid overloading the browser with
     * frequent URL updates.
     */
    const persistPosition = useDebounceCallback(
        React.useCallback(
            (newPosition: string, replace: true | false) => {
                navigate(`/${document.id}/${newPosition}`, { replace });
                setLastPosition(document.id, newPosition);
            },
            [document.id, navigate]
        ),
        200
    );

    const initialPosition = React.useMemo(() => {
        if (urlPosition && urlPosition in document.hymns) {
            return urlPosition;
        }
        if (lastPosition && lastPosition in document.hymns) {
            return lastPosition;
        }
        return null;
    }, [document, urlPosition, lastPosition]);

    const [position, _setPosition] = React.useState<string | null>(initialPosition);
    const positionRef = React.useRef<string | null>(null);

    const setPosition = React.useCallback(
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
    const observer = React.useRef<IntersectionObserver | null>(null);
    React.useEffect(() => {
        // Keep a list of all intersection ratios.
        const ratios: { [id: string]: number } = {};

        // Then whenever a threshold is crossed...
        observer.current = new IntersectionObserver(
            entries => {
                // update the above list,
                entries.forEach(entry => {
                    const id = entry.target.getAttribute("data-id")!;
                    ratios[id] = entry.intersectionRatio;
                });

                // find the first page that has the highest intersection ratio,
                const activePage = Object.entries(ratios)
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

    const observeElement = React.useCallback(element => {
        if (observer.current && element) observer.current.observe(element);
    }, []);

    return (
        <main className="MainPage" ref={mainRef}>
            <h1 className="MainPage-title">{document.title}</h1>

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
            />

            <div
                className="Document"
                style={{
                    width: `${virtualizer.totalSize}px`,
                    position: "relative",
                }}
            >
                {virtualizer.virtualItems.map(virtualColumn => {
                    const hymn = hymnList[virtualColumn.index];

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
