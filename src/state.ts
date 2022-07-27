import React from "react";
import createUseStore from "zustand";
import createStore from "zustand/vanilla";

import * as types from "./types";

type ID = types.DocumentId;
type IndexType = types.IndexType;

type AppState = {
    "app/colorScheme": string;
    "app/fontSize": number;
    "app/fontFamily": string;
    "hymn/repeatRefrain": boolean;
    "hymn/repeatChorus": boolean;
    "hymn/expandRepeatedLines": boolean;
    [key: `book/${ID}/currentIndex`]: IndexType | null;
    [key: `book/${ID}/lastLoc`]: types.HymnId | null;
    [key: `book/${ID}/index/${IndexType}/sort`]: string;
    [key: `book/${ID}/index/${IndexType}/scrollPosition`]: string | null;
    [key: `book/${ID}/index/${IndexType}/expand`]: { all: boolean; except: string[] };
};

let store = createStore<AppState>(() => {
    let jsonString = localStorage.getItem("AppState");
    return {
        "app/colorScheme": "light",
        "app/fontSize": 1.2,
        "app/fontFamily": "raleway",
        "hymn/repeatRefrain": true,
        "hymn/repeatChorus": false,
        "hymn/expandRepeatedLines": false,
        ...(jsonString === null ? {} : (JSON.parse(jsonString) as AppState)),
    };
});

type UpdateFn<T> = ((prevValue: T) => T) | T;

function setStateAndPersist(newState: UpdateFn<AppState>) {
    store.setState(prevState => {
        if (newState instanceof Function) newState = newState(prevState);
        setTimeout(() => {
            localStorage.setItem("AppState", JSON.stringify(newState));
        }, 0);
        return newState;
    }, true);
}

let useStore = createUseStore(store);

export type SetState<V> = (newValue: V, replace?: boolean | undefined) => void;

export function useAppState<K extends keyof AppState>(
    key: K,
    initialState?: AppState[K]
): [AppState[K], SetState<AppState[K]>] {
    // Get the current state, if any, from the store.
    // Also, re-render the component whenever this value changes.
    let state = useStore(state => state[key]);

    let setState = React.useCallback(
        (newValue: UpdateFn<AppState[K]>) => {
            setStateAndPersist(prevState => {
                return { ...prevState, [key]: newValue };
            });
        },
        [key]
    );

    if (state === undefined && initialState !== undefined) {
        return [initialState, setState];
    }
    return [state, setState];
}
