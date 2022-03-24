import React from "react";

/** Pass a query like `(min-width: 768px)`. */
export function useMatchMedia(query: string) {
    let [doesMatch, setDoesMatch] = React.useState(() => matchMedia(query).matches);

    React.useEffect(() => {
        function onChange(event: MediaQueryListEvent) {
            setDoesMatch(event.matches);
        }

        // Safari currently doesn't support add/removeEventListener on
        // MediaQueryLists so use add/removeListener instead. These are
        // incorrectly marked as deprecated by TypeScript:
        // https://github.com/microsoft/TypeScript/issues/32210

        let mediaQueryList = matchMedia(query);
        mediaQueryList.addListener(onChange);
        return function cleanup() {
            mediaQueryList.removeListener(onChange);
        };
    }, [query]);

    return doesMatch;
}
