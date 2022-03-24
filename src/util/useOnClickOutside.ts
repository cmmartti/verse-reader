import * as React from "react";

/**
 * @param element
 * @param handler Event handler. Must be memoized with useCallback.
 */
export function useOnClickOutside(
    element: Element,
    handler: (event: MouseEvent | TouchEvent) => void
) {
    React.useEffect(() => {
        function handleClick(event: MouseEvent | TouchEvent) {
            if (!element || element.contains(event.target as Node)) {
                return;
            }
            handler(event);
        }

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("touchstart", handleClick);

        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("touchstart", handleClick);
        };
    }, [element, handler]);
}
