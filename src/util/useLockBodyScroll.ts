import React from "react";

export function useLockBodyScroll(enabled = true) {
    React.useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;

        if (enabled) document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, [enabled]);
}
