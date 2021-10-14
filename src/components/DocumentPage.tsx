import React from "react";
import {useHistory, useLocation} from "react-router-dom";

import {DisplayOptionsProvider} from "./ContextDisplayOptions";
import {Toolbar} from "./Toolbar";
import {Document} from "./Document";
import {useDebounceCallback} from "../util/useDebounceCallback";

export function useSearch() {
    const history = useHistory();
    const location = useLocation();

    return React.useMemo(() => {
        const urlQuery = new URLSearchParams(location.search);
        const search = urlQuery.get("q") ?? "";
        function setSearch(newSearch: string | null) {
            if (newSearch) {
                urlQuery.set("q", newSearch.trim());
            } else {
                urlQuery.delete("q");
            }
            history.push({...history.location, search: urlQuery.toString()});
            window.scrollTo(1, 1);
        }

        return [search, setSearch] as const;
    }, [history, location]);
}

export function usePage() {
    const history = useHistory();
    const location = useLocation();
    const fragment = location.hash.substring(1); // remove leading #

    const [page, _setPage] = React.useState(/[0-9]+/.test(fragment) ? fragment : null);

    const updateURL = useDebounceCallback(newPage => {
        if (newPage) history.replace({...history.location, hash: "#" + newPage});
        else history.replace({...history.location, hash: undefined});
    }, 300);

    function setPage(newPage: typeof page) {
        _setPage(newPage);
        updateURL(newPage);
    }

    return [page, setPage] as const;
}

export function DocumentPage({id}: {id: string}) {
    const [search, setSearch] = useSearch();
    const [page, setPage] = usePage();

    return (
        <DisplayOptionsProvider id={id}>
            <main className="DocumentPage">
                <Toolbar
                    search={search}
                    setSearch={setSearch}
                    page={page ?? "1"}
                    setPage={(newPage: string) => {
                        document
                            .getElementById(newPage)
                            ?.scrollIntoView({inline: "start"});
                        setPage(newPage);
                    }}
                />
                <Document
                    id={id}
                    search={search}
                    setSearch={setSearch}
                    page={page ?? "1"}
                    setPage={setPage}
                />
            </main>
        </DisplayOptionsProvider>
    );
}
