import React from "react";

import {useMatchMedia} from "./useMatchMedia";

type ColorScheme = "dark" | "light" | "system";

function setColorScheme(colorScheme: "dark" | "light") {
    document.documentElement.setAttribute("data-color-scheme", colorScheme);
}

function saveColorScheme(colorScheme: ColorScheme) {
    localStorage.setItem("color-scheme", colorScheme);
}

function loadColorScheme(): ColorScheme {
    switch (localStorage.getItem("color-scheme")) {
        case "light":
            return "light";
        case "dark":
            return "dark";
        default:
            return "system";
    }
}

const ColorSchemeContext = React.createContext<
    [value: ColorScheme, setValue: (scheme: ColorScheme) => void] | undefined
>(undefined);

export function ColorSchemeProvider({children}: {children: React.ReactNode}) {
    const systemScheme = useMatchMedia("(prefers-color-scheme: dark)")
        ? "dark"
        : "light";
    const [preferredScheme, setPreferredColorScheme] = React.useState(loadColorScheme());

    React.useLayoutEffect(() => {
        saveColorScheme(preferredScheme);
        setColorScheme(preferredScheme === "system" ? systemScheme : preferredScheme);
    }, [preferredScheme, systemScheme]);

    return (
        <ColorSchemeContext.Provider value={[preferredScheme, setPreferredColorScheme]}>
            {children}
        </ColorSchemeContext.Provider>
    );
}

export function useColorScheme() {
    const context = React.useContext(ColorSchemeContext);
    if (context === undefined) {
        throw new Error("useColorScheme must be within ColorSchemeProvider");
    }
    return context;
}
