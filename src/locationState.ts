import React from "react";
import history from "history/browser";
import { To, Location } from "history";
import createUseStore from "zustand";
import createStore from "zustand/vanilla";
import "urlpattern-polyfill";

type UpdateFn<T> = ((prevValue: T) => T) | T;
type SetState<V> = (newValue: UpdateFn<V>, replace?: boolean | undefined) => void;

type LocationState = {
    sidebar: "find" | "options" | null;
    manage: boolean;
    book: string | null;
    [key: `book/${string}/loc`]: string | null;
    [key: `book/${string}/search`]: string;
};

function getLocationFromState(state: LocationState): To {
    let params = new URLSearchParams();
    let pathname = "/";

    if (state.book !== null) {
        pathname += state.book;

        let loc = state[`book/${state.book}/loc`];
        if (loc) params.set("loc", loc);

        let search = state[`book/${state.book}/search`];
        if (search) params.set("q", search);
    }

    if (state.sidebar !== null && ["find", "options"].includes(state.sidebar))
        params.set("sidebar", state.sidebar);

    if (state.manage) params.set("manage", "true");

    return {
        pathname,
        search: params.toString(),
    };
}

function getStateFromLocation(
    location: Location,
    mergeWith: LocationState
): LocationState {
    let state = { ...mergeWith };
    let params = new URLSearchParams(location.search);

    let match = new URLPattern({ pathname: "/:id" }).exec(location);
    if (match !== null) {
        let book = match.pathname.groups.id!;
        state.book = book;

        let loc = params.get("loc");
        if (loc !== null) state[`book/${book}/loc`] = loc;

        let search = params.get("q");
        if (search !== null) state[`book/${book}/search`] = search;
    }

    state.manage = params.get("manage") === "true";

    let sidebar = params.get("sidebar");
    switch (sidebar) {
        case "find":
        case "options":
            state.sidebar = sidebar;
            break;
        default:
            state.sidebar = null;
    }

    return state;
}

let store = createStore<LocationState>(() =>
    getStateFromLocation(history.location, {
        sidebar: null,
        book: null,
        manage: false,
    })
);

let useStore = createUseStore(store);

export function navigate(newState: UpdateFn<LocationState>, replace = true) {
    store.setState(prevState => {
        if (newState instanceof Function) newState = newState(prevState);

        let to = getLocationFromState(newState);
        setTimeout(() => {
            if (replace) history.replace(to);
            else history.push(to);
        }, 0);

        return newState;
    }, true);
}

export function useLocationState<K extends keyof LocationState>(
    key: K,
    initialState?: LocationState[K]
): [LocationState[K], SetState<LocationState[K]>] {
    // Get the current state, if any, from the store.
    // Also, re-render the component whenever this value changes.
    let state = useStore(state => state[key]);

    let setState = React.useCallback(
        (newValue: UpdateFn<LocationState[K]>, replace?: boolean) => {
            navigate(prevState => {
                if (newValue instanceof Function) {
                    newValue = newValue(prevState[key]);
                }
                return { ...prevState, [key]: newValue };
            }, replace);
        },
        [key]
    );

    if (state === undefined && initialState !== undefined) {
        return [initialState, setState];
    }
    return [state, setState];
}

// Listen for POP events that change the URL and update the store accordingly
history.listen(event => {
    if (event.action === "POP") {
        store.setState(prevState => getStateFromLocation(event.location, prevState));
    }
});
