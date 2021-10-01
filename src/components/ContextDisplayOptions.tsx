import React from "react";

import * as ls from "../util/localstorage";

export type Action =
    | ["expand_repeated_lines", boolean]
    | ["repeat_refrain", boolean]
    | ["repeat_chorus", boolean]
    | ["highlight", string];

const DEFAULT_OPTIONS = {
    highlight: null,
    expandRepeatedLines: false,
    repeatRefrain: false,
    repeatChorus: false,
};

export type DisplayOptions = {
    highlight: string | null;
    expandRepeatedLines: boolean;
    repeatRefrain: boolean;
    repeatChorus: boolean;
};

type Dispatch = (...action: Action) => void;

function reducer(options: DisplayOptions, action: Action): DisplayOptions {
    // TypeScript forgets that these are connected if spread here:
    // const [type, value] = action;
    switch (action[0]) {
        case "expand_repeated_lines":
            return {...options, expandRepeatedLines: action[1]};
        case "repeat_refrain":
            return {...options, repeatRefrain: action[1]};
        case "repeat_chorus":
            return {...options, repeatChorus: action[1]};
        case "highlight":
            return {...options, highlight: action[1]};
        default:
            throw new Error(`Action type is invalid.`);
    }
}

function saveOptions(documentId: string, displayOptions: DisplayOptions) {
    const res = ls.setItem(`options:${documentId}`, JSON.stringify(displayOptions));
    if (res.isErr) console.error(res.error);
}

function loadOptions(documentId: string) {
    return ls.getItem(`options:${documentId}`).unwrap(
        json => JSON.parse(json),
        err => {
            if (err instanceof ls.NotFoundError) {
                return DEFAULT_OPTIONS;
            }
            console.error(err);
            return {};
        }
    );
}

const DisplayOptionsContext = React.createContext<
    [DisplayOptions, Dispatch] | undefined
>(undefined);

export function DisplayOptionsProvider({
    children,
    id,
}: {
    children: React.ReactNode;
    id: string;
}) {
    const [displayOptions, dispatch] = React.useReducer(reducer, undefined, () =>
        loadOptions(id)
    );

    React.useEffect(() => {
        saveOptions(id, displayOptions);
    }, [id, displayOptions]);

    const contextValue = React.useMemo(
        () =>
            [
                displayOptions,
                (...action: Action) => {
                    // console.log("SET", `"${action[0]}"`, action[1]);
                    dispatch(action);
                },
            ] as [DisplayOptions, Dispatch],
        [displayOptions]
    );

    return (
        <DisplayOptionsContext.Provider value={contextValue}>
            {children}
        </DisplayOptionsContext.Provider>
    );
}

export function useDisplayOptions() {
    const context = React.useContext(DisplayOptionsContext);
    if (context === undefined) {
        throw new Error("useDisplayOptions must be within DisplayOptionsProvider");
    }
    return context;
}
