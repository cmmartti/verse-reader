import React from "react";

let getKeyDefault = (element: HTMLElement) => element.id;

export function useVisibleRange({
    initialPage,
    keys,
    getKey = getKeyDefault,
    overscan = 3,
    ref,
}: {
    initialPage: string;
    keys: string[];
    getKey?: (element: HTMLElement) => string;
    overscan?: number;
    ref: React.MutableRefObject<HTMLElement>;
}) {
    let [range, setRange] = React.useState(() =>
        extractRange({ keys, start: initialPage, end: initialPage, overscan })
    );

    React.useEffect(() => {
        let ratios = new Map<string, number>();

        let callback: IntersectionObserverCallback = entries => {
            entries.forEach(e =>
                ratios.set(getKey(e.target as HTMLElement), e.intersectionRatio)
            );

            let start: string | undefined;
            let end: string | undefined;
            let keys = [...ref.current.children].map(element =>
                getKey(element as HTMLElement)
            );
            for (let id of keys) {
                if ((ratios.get(id) || 0) > 0) {
                    if (!start) start = id;
                    end = id;
                }
            }
            if (start && end) {
                setRange(extractRange({ keys, start, end, overscan }));
            }
        };

        let observer = new IntersectionObserver(callback, { threshold: [0, 0.5, 1] });
        [...ref.current.children].forEach(child => observer.observe(child));

        return () => {
            observer.disconnect();
        };
    }, [ref, getKey, keys, overscan]);

    return range;
}

function extractRange(range: {
    keys: string[];
    start: string;
    end: string;
    overscan: number;
}): string[] {
    let indexOfStart = range.keys.findIndex(key => key === range.start);
    let indexOfEnd = range.keys.findIndex(key => key === range.end);

    if (indexOfStart === -1 || indexOfEnd === -1) {
        // console.log([range.start, indexOfStart], [range.end, indexOfEnd], range.keys);
        throw new Error("[useVisibleRange] Range start/end must appear in keys");
    }

    let start = Math.max(indexOfStart - range.overscan, 0);
    let end = Math.min(indexOfEnd + range.overscan, range.keys.length - 1);

    let arr = [];
    for (let i = start; i <= end; i++) {
        let key = range.keys[i];
        if (key !== undefined) arr.push(key);
    }
    return arr;
}
