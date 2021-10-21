import React from "react";
import {useHistory, useLocation} from "react-router-dom";

import {DisplayOptionsProvider} from "./ContextDisplayOptions";
import {Toolbar} from "./Toolbar";
import {Document} from "./Document";
import {useDebounceCallback} from "../util/useDebounceCallback";
import {getDocument} from "../util/documentRepository";
import {HymnalDocument} from "../HymnalDocument";

function useSearch() {
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
        }

        return [search, setSearch] as const;
    }, [history, location]);
}

export function DocumentPage({id}: {id: string}) {
    const [search, setSearch] = useSearch();

    const initialPage = useLocation().hash.substring(1) || null; // remove leading #
    const [page, _setPage] = React.useState(initialPage);

    React.useEffect(() => {
        if (initialPage)
            document
                .querySelector(`[data-id="${initialPage}"]`)
                ?.scrollIntoView({inline: "start", behavior: "auto"});
    }, [initialPage]);

    const _syncURL = React.useCallback(
        (newPage: typeof page) => {
            if (newPage) {
                window.history.replaceState(
                    null,
                    "",
                    "/" + id + (search ? "?q=" + search : "") + (page ? "#" + page : "")
                );
            }
        },
        [id, page, search]
    );
    const syncURL = useDebounceCallback(_syncURL, 200);
    const setPage = React.useCallback(
        (newPage: typeof page) => {
            _setPage(newPage);
            syncURL(newPage);
        },
        [syncURL]
    );

    const hymnalDocument = React.useMemo(
        () => new HymnalDocument(getDocument(id).unwrap()),
        [id]
    );

    return (
        <DisplayOptionsProvider id={id}>
            <main className="DocumentPage">
                <Toolbar
                    search={search}
                    setSearch={setSearch}
                    page={page ?? "1"}
                    setPage={(newPage: string) => {
                        const target = document.querySelector(
                            `[data-id="${newPage}"]`
                        ) as HTMLButtonElement;
                        target?.scrollIntoView({inline: "start", behavior: "auto"});
                        target?.focus({preventScroll: true});
                        // setPage(newPage);
                    }}
                    document={hymnalDocument}
                />
                <Document document={hymnalDocument} search={search} setPage={setPage} />
            </main>
        </DisplayOptionsProvider>
    );
}
