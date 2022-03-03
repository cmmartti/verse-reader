import * as React from "react";

export function useViewportWidth<E extends HTMLElement>(
    elementRef: React.MutableRefObject<E>,
    initialWidth: number
) {
    const [viewportWidth, setViewportWidth] = React.useState(initialWidth);

    React.useEffect(() => {
        function resizeHandler() {
            setViewportWidth(elementRef.current.offsetWidth);
        }
        resizeHandler();
        window.addEventListener("resize", resizeHandler);
        return () => window.removeEventListener("resize", resizeHandler);
    }, [elementRef]);

    return viewportWidth;
}
