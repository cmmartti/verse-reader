import * as React from "react";

export function useViewportWidth<E extends HTMLElement>(
    elementRef: React.MutableRefObject<E>,
    initialWidth: number
) {
    let [viewportWidth, setViewportWidth] = React.useState(initialWidth);
    let [viewportHeight, setViewportHeight] = React.useState(initialWidth);

    React.useEffect(() => {
        function resizeHandler() {
            setViewportWidth(elementRef.current.offsetWidth);
            setViewportHeight(elementRef.current.offsetHeight);
        }
        resizeHandler();
        window.addEventListener("resize", resizeHandler);
        return () => window.removeEventListener("resize", resizeHandler);
    }, [elementRef]);

    return [viewportWidth, viewportHeight];
}

export function useViewportHeight(initialWidth: number = 0) {
    let [viewportHeight, setViewportHeight] = React.useState(initialWidth);

    React.useEffect(() => {
        function resizeHandler() {
            setViewportHeight(window.innerHeight);
        }
        resizeHandler();
        window.addEventListener("resize", resizeHandler);
        return () => window.removeEventListener("resize", resizeHandler);
    }, []);

    return viewportHeight;
}
