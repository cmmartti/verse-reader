import React from "react";

const OVERSCAN = 3;

export type PageId = string;

export function HorizontalScroller({
    pages,
    initialPage,
    onPageChange,
}: {
    pages: { id: PageId; children: React.ReactNode }[];
    initialPage: PageId;
    onPageChange: (newPosition: PageId) => void;
}) {
    let ref = React.useRef<HTMLDivElement>(null!);

    let [loaded, setLoaded] = React.useState(() =>
        extractRange({
            list: pages.map(page => page.id),
            start: initialPage,
            end: initialPage,
            overscan: OVERSCAN,
        })
    );

    let latestPositionRef = React.useRef<string | null>(null);

    React.useLayoutEffect(() => {
        if (initialPage !== latestPositionRef.current) {
            [...ref.current.children]
                .find(element => element.id === initialPage)
                ?.scrollIntoView({ inline: "start" });
        }
    }, [initialPage]);

    React.useEffect(() => {
        let list = [...ref.current.children].map(child => child.id);
        let ratios = new Map(list.map(hymnId => [hymnId, 0]));

        let callback: IntersectionObserverCallback = entries => {
            for (let entry of entries) {
                ratios.set(entry.target.id, entry.intersectionRatio);
            }

            let newPosition = list.reduce((prev, cur) =>
                ratios.get(cur)! > ratios.get(prev)! ? cur : prev
            );
            latestPositionRef.current = newPosition;
            onPageChange(newPosition);

            let start: PageId | undefined;
            let end: PageId | undefined;
            for (let id of list) {
                if (ratios.get(id)! > 0) {
                    if (!start) start = id;
                    end = id;
                }
            }
            if (start && end)
                setLoaded(extractRange({ list, start, end, overscan: OVERSCAN }));
        };

        let observer = new IntersectionObserver(callback, { threshold: [0, 0.5, 1] });
        for (let child of [...ref.current.children]) {
            observer.observe(child);
        }

        return () => observer.disconnect();
    }, [onPageChange]);

    return (
        <div className="HorizontalScroller" ref={ref}>
            {pages.map(page => (
                <div key={page.id} id={page.id}>
                    {loaded.includes(page.id) && page.children}
                </div>
            ))}
        </div>
    );
}

type Range = {
    list: PageId[];
    start: PageId;
    end: PageId;
    overscan: number;
};

function extractRange(range: Range): PageId[] {
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
