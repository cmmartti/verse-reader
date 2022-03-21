import React from "react";

import { useViewportWidth } from "../util/useViewportWidth";
import { Hymn } from "./Hymn";
import { useCSSVar } from "../util/useCSSVar";
import { HymnalDocument } from "../types";

const HYMN_WIDTH_PREFERRED = 560;
const HYMN_HEIGHT_PREFERRED = 500;

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

    let [viewportWidth, viewportHeight] = useViewportWidth(
        parentRef,
        HYMN_WIDTH_PREFERRED
    );

    let mobileMode =
        viewportHeight < HYMN_HEIGHT_PREFERRED || viewportWidth < HYMN_WIDTH_PREFERRED;
    useCSSVar("--scroll-snap-type", mobileMode ? "x mandatory" : "none");

    let ref = React.useRef<HTMLDivElement>(null!);

    React.useLayoutEffect(() => {
        if (shouldScroll) {
            let el = [...ref.current.children].find(
                el => el.getAttribute("data-id") === position
            );
            el?.scrollIntoView({ inline: "start" });
        }
    }, [shouldScroll, position]);

    let [loaded, setLoaded] = React.useState(
        extractRange({
            list: Object.keys(document.hymns),
            start: position,
            end: position,
            overscan: 5,
        })
    );

    React.useEffect(() => {
        // Keep a list of all intersection ratios.
        let ratios: { [id: string]: number } = {};
        let list = [...ref.current.children]
            .map(child => child.getAttribute("data-id")!)
            .filter(Boolean);

        // Update the current position when scrolling occurs
        // Then whenever a threshold is crossed...
        let observer = new IntersectionObserver(
            entries => {
                // update the above list,
                entries.forEach(entry => {
                    let id = entry.target.getAttribute("data-id");
                    if (id) ratios[id] = entry.intersectionRatio;
                });

                // find the first page that has the highest intersection ratio,
                // TODO: Order is not guaranteed
                let activePage = Object.entries(ratios)
                    .map(([id, ratio]) => ({ id, ratio }))
                    .reduce((prev, cur) => (cur.ratio > prev.ratio ? cur : prev));

                // and set it as the current page.
                if (activePage) setPosition(activePage.id);

                let start: string | null = null;
                let end: string | null = null;
                for (let id of list) {
                    if (!start && ratios[id] > 0) start = id;
                    if (ratios[id] > 0) end = id;
                }

                if (start && end)
                    setLoaded(extractRange({ list, start, end, overscan: 5 }));
            },
            {
                threshold: [0, 0.5, 1],
                root: ref.current,
            }
        );

        for (let child of [...ref.current.children]) {
            observer.observe(child);
        }

        return () => observer.disconnect();
    }, [setPosition]);

    return (
        <div className="Document" ref={ref}>
            {hymnList.map(hymn => (
                <div key={hymn.id} data-id={hymn.id}>
                    {loaded.includes(hymn.id) && (
                        <Hymn hymn={hymn} document={document} />
                    )}
                </div>
            ))}
        </div>
    );
}

type Range = { list: string[]; start: string; end: string; overscan: number };

function extractRange(range: Range): string[] {
    let indexOfStart = range.list.findIndex(id => id === range.start);
    let indexOfEnd = range.list.findIndex(id => id === range.end);

    if (indexOfStart === -1 || indexOfEnd === -1)
        throw new Error("Range start/end must appear in list");

    let start = Math.max(indexOfStart - range.overscan, 0);
    let end = Math.min(indexOfEnd + range.overscan, range.list.length - 1);

    let arr = [];
    for (let i = start; i <= end; i++) arr.push(range.list[i]);
    return arr;
}
