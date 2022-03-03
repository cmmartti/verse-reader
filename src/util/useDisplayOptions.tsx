import React from "react";

import * as ls from "./localstorage";
import { useColorScheme } from "./useColorScheme";
import { useFontSize } from "./useFontSize";

export type Options = {
    expandRepeatedLines: boolean;
    repeatRefrain: boolean;
    repeatChorus: boolean;
    hideDeletedLines: boolean;
    colorScheme: "dark" | "light" | "system";
    fontSize: number;
    fontFamily: string;
};

const DEFAULT_OPTIONS: Options = {
    expandRepeatedLines: false,
    repeatRefrain: true,
    repeatChorus: false,
    hideDeletedLines: false,
    colorScheme: "light",
    fontSize: 1,
    fontFamily: "charter",
};

export type Action =
    | ["expand_repeated_lines", boolean]
    | ["repeat_refrain", boolean]
    | ["repeat_chorus", boolean]
    | ["hide_deleted_lines", boolean]
    | ["color_scheme", "dark" | "light" | "system"]
    | ["font_family", string]
    | ["font_size", number];

type Dispatch = (...action: Action) => void;

function reducer(options: Options, action: Action): Options {
    // TypeScript forgets that these are connected if spread here:
    // const [type, value] = action;

    switch (action[0]) {
        case "expand_repeated_lines":
            return { ...options, expandRepeatedLines: action[1] };
        case "repeat_refrain":
            return { ...options, repeatRefrain: action[1] };
        case "repeat_chorus":
            return { ...options, repeatChorus: action[1] };
        case "hide_deleted_lines":
            return { ...options, hideDeletedLines: action[1] };
        case "color_scheme":
            return { ...options, colorScheme: action[1] };
        case "font_size":
            return { ...options, fontSize: action[1] };
        case "font_family":
            return { ...options, fontFamily: action[1] };
        default:
            throw new Error(`Action type "${action[0]}" is invalid.`);
    }
}

function saveOptions(options: Options) {
    const res = ls.setItem("options", JSON.stringify(options));
    if (res.isErr) console.error(res.error);
}

function loadOptions() {
    return {
        ...DEFAULT_OPTIONS,
        ...ls.getItem("options").unwrap(
            json => JSON.parse(json),
            err => {
                console.error(err);
                return {};
            }
        ),
    };
}

const OptionsContext = React.createContext<[Options, Dispatch] | undefined>(undefined);

export function DisplayOptionsProvider({ children }: { children: React.ReactNode }) {
    const [options, dispatch] = React.useReducer(reducer, undefined, () =>
        loadOptions()
    );

    React.useEffect(() => {
        saveOptions(options);
    }, [options]);

    useColorScheme(options.colorScheme);
    useFontSize(options.fontSize, options.fontFamily);

    const contextValue = React.useMemo(
        () =>
            [
                options,
                (...action: Action) => {
                    // console.log("SET", `"${action[0]}"`, action[1]);
                    dispatch(action);
                },
            ] as [Options, Dispatch],
        [options]
    );

    return (
        <OptionsContext.Provider value={contextValue}>
            {children}
        </OptionsContext.Provider>
    );
}

export function useDisplayOptions() {
    const context = React.useContext(OptionsContext);
    if (context === undefined) {
        throw new Error("useDisplayOptions must be within DisplayOptionsProvider");
    }
    return context;
}
