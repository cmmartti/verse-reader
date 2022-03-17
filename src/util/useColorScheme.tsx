import React from "react";
import { useMatchMedia } from "../util/useMatchMedia";

export function useColorScheme(colorScheme: "dark" | "light" | "system") {
    let systemColorScheme = useMatchMedia("(prefers-color-scheme: dark)")
        ? "dark"
        : "light";

    // Synchronously apply the colour scheme before anything is rendered
    // to avoid momentarily displaying the wrong color scheme.
    React.useLayoutEffect(() => {
        // Set an attribute on the root element that can be detected with CSS
        document.documentElement.setAttribute(
            "data-color-scheme",
            colorScheme === "system" ? systemColorScheme : colorScheme
        );
    }, [colorScheme, systemColorScheme]);
}
