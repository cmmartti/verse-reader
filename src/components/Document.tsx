import React from "react";

import * as types from "../types";
import { Hymn } from "./Hymn";

const OVERSCAN = 3;

export function Document({
    position,
    setPosition,
    shouldScroll,
    document,
}: {
    position: types.HymnId;
    setPosition: (newPosition: types.HymnId) => void;
    shouldScroll: boolean;
    document: types.HymnalDocument;
}) {
    let ref = React.useRef<HTMLDivElement>(null!);

    React.useLayoutEffect(() => {
        if (shouldScroll) {
            let el = [...ref.current.children].find(el => el.id === position);
            el?.scrollIntoView({ inline: "start" });
        }
    }, [shouldScroll, position]);

    React.useEffect(() => {
        let ids = [...ref.current.children].map(child => child.id);
        let ratios = new Map(ids.map(hymnId => [hymnId, 0]));

        let observer = new IntersectionObserver(
            entries => {
                for (let entry of entries) {
                    ratios.set(entry.target.id, entry.intersectionRatio);
                }

                setPosition(
                    ids.reduce((prev, cur) =>
                        ratios.get(cur)! > ratios.get(prev)! ? cur : prev
                    )
                );

                let start: types.HymnId | null = null;
                let end: types.HymnId | null = null;
                for (let id of ids) {
                    if (ratios.get(id)! > 0) {
                        if (!start) start = id;
                        end = id;
                    }
                }

                if (start && end)
                    setLoaded(
                        extractRange({
                            list: ids,
                            start,
                            end,
                            overscan: OVERSCAN,
                        })
                    );
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

    let [loaded, setLoaded] = React.useState(() =>
        extractRange({
            list: Object.keys(document.hymns),
            start: position,
            end: position,
            overscan: OVERSCAN,
        })
    );

    let hymnList = React.useMemo(() => Object.values(document.hymns), [document]);

    return (
        <div className="Document" ref={ref}>
            {hymnList.map(hymn => (
                <div key={hymn.id} id={hymn.id}>
                    {loaded.includes(hymn.id) && (
                        <Hymn hymn={hymn} document={document} />
                    )}
                </div>
            ))}
        </div>
    );
}

type Range = {
    list: types.HymnId[];
    start: types.HymnId;
    end: types.HymnId;
    overscan: number;
};

function extractRange(range: Range): types.HymnId[] {
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
