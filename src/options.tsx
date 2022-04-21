import React from "react";

import { useColorScheme } from "./util/useColorScheme";
import { useCSSVar } from "./util/useCSSVar";

const OptionsContext = React.createContext<[Options, Dispatch] | undefined>(undefined);

export function OptionsProvider({ children }: { children: React.ReactNode }) {
    let [options, _dispatch] = React.useReducer(reducer, undefined, () => loadOptions());

    React.useEffect(() => {
        saveOptions(options);
    }, [options]);

    useCSSVar("--ui-scale-factor", options.fontSize.toString());
    useCSSVar("--font-family", options.fontFamily);
    useColorScheme(options.colorScheme);

    let dispatch = React.useCallback((...action: Action) => {
        // console.log("SET", `"${action[0]}"`, action[1]);
        _dispatch(action);
    }, []);

    return (
        <OptionsContext.Provider
            value={React.useMemo(() => [options, dispatch], [options, dispatch])}
        >
            {children}
        </OptionsContext.Provider>
    );
}

export function useOptions() {
    let context = React.useContext(OptionsContext);
    if (context === undefined) {
        throw new Error("useOptions must be within OptionsProvider");
    }
    return context;
}

type Options = {
    expandRepeatedLines: boolean;
    repeatRefrain: boolean;
    repeatChorus: boolean;
    colorScheme: "dark" | "light" | "system" | "classic";
    fontSize: number;
    fontFamily: string;
};

const DEFAULT_OPTIONS: Options = {
    expandRepeatedLines: false,
    repeatRefrain: true,
    repeatChorus: false,
    colorScheme: "light",
    fontSize: 1.2,
    fontFamily: "charter",
};

export type Action =
    | ["expand_repeated_lines", boolean]
    | ["repeat_refrain", boolean]
    | ["repeat_chorus", boolean]
    | ["color_scheme", "dark" | "light" | "system"]
    | ["font_family", string]
    | ["font_size", number];

type Dispatch = (...action: Action) => void;

function reducer(options: Options, [key, value]: Action): Options {
    switch (key) {
        case "expand_repeated_lines":
            return { ...options, expandRepeatedLines: value };
        case "repeat_refrain":
            return { ...options, repeatRefrain: value };
        case "repeat_chorus":
            return { ...options, repeatChorus: value };
        case "color_scheme":
            return { ...options, colorScheme: value };
        case "font_size":
            return { ...options, fontSize: value };
        case "font_family":
            return { ...options, fontFamily: value };
        default:
            throw new Error(`Action key "${key}" is invalid.`);
    }
}

function saveOptions(options: Options) {
    localStorage.setItem("options", JSON.stringify(options));
}

function loadOptions() {
    let optionsJSON = localStorage.getItem("options");
    if (!optionsJSON) {
        console.error("Error loading app options from LocalStorage.");
        return DEFAULT_OPTIONS;
    }
    return {
        ...DEFAULT_OPTIONS,
        ...(JSON.parse(optionsJSON) as Options),
    };
}
