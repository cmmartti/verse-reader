import React from "react";

let getKeyDefault = (element: Element) => element.id;

/**
 * Call the `onChange` callback whenever the scroll position of `ref` changes, passing
 * the key of the current child element to the callback. The key is determined by the
 * supplied `getKey` function, which extracts a unique key from the child Element.
 *
 * Upon first render, the scroll position will be set to the element with a key of `initialPage`.
 */
export function useCurrentPage<E extends Element>({
    initialPage,
    keys,
    getKey = getKeyDefault,
    onChange,
    ref,
}: {
    initialPage: string | null;
    keys: string[];
    getKey?: (element: Element) => string;
    onChange?: (page: string) => void;
    ref: React.MutableRefObject<E>;
}) {
    let latestPageRef = React.useRef<string | null>(null);

    React.useLayoutEffect(() => {
        // Only scroll if the page change was not triggered by the user scrolling
        if (initialPage !== latestPageRef.current) {
            [...ref.current.children]
                .find(element => getKey(element) === initialPage)
                ?.scrollIntoView({ inline: "start" });
        }
    }, [initialPage, getKey, ref]);

    let onChange_ref = React.useRef(onChange);
    let getKey_ref = React.useRef(getKey);
    React.useEffect(() => {
        onChange_ref.current = onChange;
        getKey_ref.current = getKey;
    });

    React.useEffect(() => {
        let ratios = new Map<string, number>();

        let compareRatios = (prev: string, cur: string) =>
            (ratios.get(cur) || 0) > (ratios.get(prev) || 0) ? cur : prev;

        let callback: IntersectionObserverCallback = entries => {
            entries.forEach(e =>
                ratios.set(getKey_ref.current(e.target), e.intersectionRatio)
            );

            let newPage = keys.reduce(compareRatios);
            latestPageRef.current = newPage;
            if (onChange_ref.current) onChange_ref.current(newPage);
        };

        let observer = new IntersectionObserver(callback, {
            threshold: [0, 0.5, 1],
            root: ref.current,
        });
        [...ref.current.children].forEach(child => observer.observe(child));

        return () => observer.disconnect();
    }, [ref, keys]);
}
