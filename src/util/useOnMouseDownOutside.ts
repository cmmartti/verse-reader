import React from "react";

export function useOnMouseDownOutside<E extends HTMLElement>(
    elementRef: React.RefObject<E>,
    onClickOutside: (element: E, target: Element | null) => void
) {
    React.useEffect(() => {
        function handler(event: Event) {
            let target = event.target as Element | null;
            if (elementRef.current && !elementRef.current.contains(target)) {
                onClickOutside(elementRef.current, target);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [elementRef, onClickOutside]);
}
