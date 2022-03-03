import * as React from "react";

/**
 *
 * @param ref
 * @param handler Event handler. Must be memoized with useCallback.
 */
export function useOnClickOutside(
    refs: React.MutableRefObject<HTMLElement>[],
    handler: (event: MouseEvent | TouchEvent) => void
) {
    React.useEffect(() => {
        function handleClick(event: MouseEvent | TouchEvent) {
            for (const ref of refs) {
                if (!ref.current || ref.current.contains(event.target as Node)) {
                    return;
                }
            }
            handler(event);
        }

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("touchstart", handleClick);

        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("touchstart", handleClick);
        };
    }, [refs, handler]);
}
