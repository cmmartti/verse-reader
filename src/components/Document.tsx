import React from "react";
import { useVirtual } from "react-virtual";

import { useViewportWidth } from "../util/useViewportWidth";
import { Hymn } from "./Hymn";
import { useCSSVar } from "../util/useCSSVar";
import { HymnalDocument } from "../types";

const HYMN_WIDTH_PREFERRED = 560;
const HYMN_HEIGHT_PREFERRED = 500;
const HYMN_SPACING = 1;

export function Document<E extends HTMLElement>({
    parentRef,
    position,
    setPosition,
    shouldScroll,
    document,
}: {
    parentRef: React.MutableRefObject<E>;
    position: string;
    setPosition: (newPosition: string) => void;
    shouldScroll: boolean;
    document: HymnalDocument;
}) {
    let hymnList = React.useMemo(() => Object.values(document.hymns), [document]);

    // Increase scrolling performance by limiting total DOM elements,
    // using a virtualizer to only keep a few pages in memory at a time.
    let [viewportWidth, viewportHeight] = useViewportWidth(
        parentRef,
        HYMN_WIDTH_PREFERRED
    );

    let mobileMode =
        viewportHeight < HYMN_HEIGHT_PREFERRED || viewportWidth < HYMN_WIDTH_PREFERRED;
    useCSSVar("--scroll-snap-type", mobileMode ? "x mandatory" : "none");

    let { scrollToIndex, ...virtualizer } = useVirtual({
        size: hymnList.length,
        parentRef: parentRef,
        horizontal: true,
        paddingEnd: viewportWidth - Math.min(HYMN_WIDTH_PREFERRED, viewportWidth),
        estimateSize: React.useCallback(
            () => (mobileMode ? viewportWidth : HYMN_WIDTH_PREFERRED) + HYMN_SPACING,
            [viewportWidth, mobileMode]
        ),
        overscan: 3,
    });

    React.useLayoutEffect(() => {
        if (shouldScroll)
            scrollToIndex(
                hymnList.findIndex(hymn => hymn.id === position),
                { align: "start" }
            );
    }, [shouldScroll, scrollToIndex, hymnList, position]);

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
                if (activePage) setPosition(activePage.id);
            },
            { threshold: [0, 0.5, 1], root: parentRef.current }
        );

        return () => observer.current!.disconnect();
    }, [setPosition, parentRef]);

    let observeElement = React.useCallback(element => {
        if (observer.current && element) observer.current.observe(element);
    }, []);

    return (
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
    );
}
