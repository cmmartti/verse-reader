import React from "react";

export function useFontSize(fontSize: number, fontFamily: string) {
    React.useLayoutEffect(() => {
        document.documentElement.style.setProperty(
            "--ui-scale-factor",
            fontSize.toFixed(1)
        );
        document.documentElement.style.setProperty("--document-font-family", fontFamily);
    }, [fontSize, fontFamily]);
}
