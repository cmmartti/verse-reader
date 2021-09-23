import React from "react";
import {useLocation, useHistory} from "react-router-dom";
import {To} from "history";

export type Keyword = [keyword: string, value: string];
export type Search = {
    raw: string;
    text: string;
    keywords: Keyword[];
};
export type DocumentLocation = {
    page: string | null;
    search: Search;
};

type DocumentLocationFns = {
    setPage: (value: string, scroll?: boolean) => void;
    setSearch: (value: string) => void;
    getSearchURL: (value: string) => To;
};

export const DocumentLocationContext = React.createContext<
    (DocumentLocation & DocumentLocationFns) | undefined
>(undefined);

export function useDocumentLocation() {
    const context = React.useContext(DocumentLocationContext);
    if (context === undefined) {
        throw new Error("useDocumentLocation must be within DocumentLocationProvider");
    }
    return context;
}

export function DocumentLocationProvider({children}: {children: React.ReactNode}) {
    const history = useHistory();
    const location = useLocation();

    const contextValue = React.useMemo(() => {
        const fragment = location.hash.substring(1); // remove the leading #
        const urlQuery = new URLSearchParams(location.search);

        const page = /[0-9]+/.test(fragment) ? fragment : null;
        function setPage(newPage: string | null, scroll = true) {
            if (newPage) {
                if (scroll) document.getElementById(newPage)?.scrollIntoView();
                history.push({...history.location, hash: "#" + newPage});
            } else history.push({...history.location, hash: undefined});
        }

        const q = urlQuery.get("q") ?? "";
        const keywordsRegex = new RegExp(/([A-Za-z_-]+):([0-9A-Za-z_-]+)/, "gi");
        const search = {
            raw: q,
            text: q
                .replaceAll(keywordsRegex, "") // remove keywords
                .replaceAll(/\s/g, " ") // normalise space
                .trim(),
            keywords: [...q.matchAll(keywordsRegex)].map(
                match => [match[1], match[2]] as Keyword
            ),
        };

        function setSearch(newSearch: string | null) {
            if (newSearch) {
                urlQuery.set("q", newSearch.trim());
            } else {
                urlQuery.delete("q");
            }
            history.push({...history.location, search: urlQuery.toString()});
            if (page)
                document.getElementById(page)?.scrollIntoView() ?? window.scrollTo(1, 1);
            else window.scrollTo(1, 1);
        }

        function getSearchURL(value: string): To {
            let queryString = new URLSearchParams({q: value}).toString();
            if (page) return {search: queryString, hash: "#" + page};
            return {search: queryString};
        }

        return {page, setPage, search, setSearch, getSearchURL};
    }, [history, location]);

    return (
        <DocumentLocationContext.Provider value={contextValue}>
            {children}
        </DocumentLocationContext.Provider>
    );
}
