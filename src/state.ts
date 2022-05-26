import React from "react";
import createUseStore from "zustand";
import createStore from "zustand/vanilla";
import history from "history/browser";
import { To, Location } from "history";
import "urlpattern-polyfill";

import * as types from "./types";

type ID = types.DocumentId;
type IndexType = types.IndexType;

type AppState = {
    "app/currentBook": ID | null;
    "app/installedBooks": ID[];
    "app/mode": "find" | "options" | "manage" | "read";
    "app/findTab": "index-tab" | "search-tab" | "lists-tab";
    "app/colorScheme": "light" | "dark" | "system";
    "app/fontSize": number;
    "app/fontFamily": string;
    "hymn/repeatRefrain": boolean;
    "hymn/repeatChorus": boolean;
    "hymn/expandRepeatedLines": boolean;
    [key: `book/${ID}/title`]: string;
    [key: `book/${ID}/year`]: string;
    [key: `book/${ID}/publisher`]: string | null;
    [key: `book/${ID}/loc`]: types.HymnId | null;
    [key: `book/${ID}/currentIndex`]: IndexType;
    [key: `book/${ID}/search`]: string;
    [key: `book/${ID}/index/${IndexType}/sort`]: string;
    [key: `book/${ID}/index/${IndexType}/scrollPosition`]: string | null;
    [key: `book/${ID}/index/${IndexType}/defaultExpand`]: boolean;
    [key: `book/${ID}/index/${IndexType}/expandedEntries`]: Record<string, boolean>;
};

function getLocationFromState(state: AppState): To {
    let params = new URLSearchParams();
    let pathname = "/";

    let currentBook = state["app/currentBook"];
    if (currentBook !== null) {
        pathname += currentBook;

        let loc = state[`book/${currentBook}/loc`];
        if (loc) params.set("loc", loc);

        let search = state[`book/${currentBook}/search`];
        if (search) params.set("q", search);
    }

    let mode = state["app/mode"];
    if (mode === "find" || mode === "manage" || mode === "options")
        params.set("mode", mode);

    if (mode === "find") {
        if (state["app/findTab"] === "index-tab") params.set("tab", "index");
        if (state["app/findTab"] === "search-tab") params.set("tab", "search");
        if (state["app/findTab"] === "lists-tab") params.set("tab", "lists");
    }

    return { pathname, search: params.toString() };
}

function getStateFromLocation(location: Location, mergeWith: AppState): AppState {
    let state = { ...mergeWith };
    let params = new URLSearchParams(location.search);

    let match = new URLPattern({ pathname: "/:id" }).exec(location);
    if (match !== null) {
        let currentBook = match.pathname.groups.id!;
        state["app/currentBook"] = currentBook;

        let loc = params.get("loc");
        if (loc !== null) state[`book/${currentBook}/loc`] = loc;

        let search = params.get("q");
        if (search !== null) state[`book/${currentBook}/search`] = search;
    }

    let mode = params.get("mode");
    if (mode === "find" || mode === "options" || mode === "manage") {
        state["app/mode"] = mode;
    } else state["app/mode"] = "read";

    if (state["app/mode"] === "find") {
        if (params.get("tab") === "index") state["app/findTab"] = "index-tab";
        if (params.get("tab") === "search") state["app/findTab"] = "search-tab";
        if (params.get("tab") === "lists") state["app/findTab"] = "lists-tab";
    }

    return state;
}

let store = createStore<AppState>(() => {
    let jsonString = localStorage.getItem("AppState");
    return getStateFromLocation(history.location, {
        "app/mode": "read",
        "app/findTab": "index-tab",
        "app/currentBook": null,
        "app/installedBooks": [],
        "app/colorScheme": "light",
        "app/fontSize": 1.2,
        "app/fontFamily": "raleway",
        "hymn/repeatRefrain": true,
        "hymn/repeatChorus": false,
        "hymn/expandRepeatedLines": false,
        ...(jsonString === null ? {} : (JSON.parse(jsonString) as AppState)),
    });
});

// Listen for POP events that change the URL and update the store accordingly
history.listen(event => {
    if (event.action === "POP") {
        store.setState(prevState => {
            let state = getStateFromLocation(event.location, prevState);
            localStorage.setItem("AppState", JSON.stringify(state));
            return state;
        });
    }
});

export function setStateAndNavigate(newState: FnUpdate<AppState>, replace = true) {
    store.setState(prevState => {
        if (newState instanceof Function) newState = newState(prevState);

        let to = getLocationFromState(newState);
        if (replace) history.replace(to);
        else history.push(to);

        localStorage.setItem("AppState", JSON.stringify(newState));

        return newState;
    }, true);
}

export function setAppState<K extends keyof AppState>(
    key: K,
    newValue: FnUpdate<AppState[K]>,
    replace?: boolean
) {
    setStateAndNavigate(prevState => {
        if (newValue instanceof Function) {
            newValue = newValue(prevState[key]);
        }

        return { ...prevState, [key]: newValue };
    }, replace);
}

let useStore = createUseStore(store);

export function useAppState<K extends keyof AppState>(
    key: K,
    initialState?: AppState[K]
) {
    // Get the current state, if any, from the store.
    // Also, re-render the component whenever this value changes.
    let state = useStore(state => state[key]);

    let setState = React.useCallback(
        (newValue: FnUpdate<AppState[K]>, replace?: boolean) =>
            setAppState(key, newValue, replace),
        [key]
    );

    if (state === undefined && initialState !== undefined) {
        return [initialState, setState] as const;
    }

    return [state, setState] as const;
}

type FnUpdate<T> = T | ((prevValue: T) => T);
