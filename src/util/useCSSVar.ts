import React from "react";

/**
 * Set a custom property in CSS.
 * Synchronously apply it before anything is rendered to avoid momentarily
 * displaying the wrong thing.
 */
export function useCSSVar(name: string, value: string | number) {
    React.useLayoutEffect(() => {
        document.documentElement.style.setProperty(name, value.toString());
    }, [name, value]);
}
