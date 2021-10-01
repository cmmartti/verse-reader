import React from "react";
import {Link, useHistory, useLocation} from "react-router-dom";
import {Scrollbar} from "react-scrollbars-custom";

import {ReactComponent as MenuIcon} from "../assets/menu-24px.svg";
import {ReactComponent as SearchIcon} from "../assets/search-24px.svg";
import {ReactComponent as CloseIcon} from "../assets/close_black_24dp.svg";
import {ReactComponent as ArrowBackIcon} from "../assets/arrow_back_black_24dp.svg";
import {ReactComponent as ArrowForwardIcon} from "../assets/arrow_forward_black_24dp.svg";

import {DocumentView} from "./DocumentView";
import {useMatchMedia} from "../util/useMatchMedia";
import {useIsInstalled} from "../util/useIsInstalled";
import {GoToDialog} from "./GoToDialog";
import {DisplayOptionsDialog} from "./DisplayOptionsDialog";
import {DisplayOptionsProvider} from "./ContextDisplayOptions";

const indices = {
    liturgical: "Liturgical Index",
    tunes: "Index of Tunes",
    topical: "Topical Index",
    alphabetical: "Alphabetical Index",
};

export type Keyword = [keyword: string, value: string];
export type Search = {
    raw: string;
    text: string;
    keywords: Keyword[];
};

export function useSearch() {
    const history = useHistory();
    const location = useLocation();

    return React.useMemo(() => {
        const urlQuery = new URLSearchParams(location.search);

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
            window.scrollTo(1, 1);
        }

        return [search, setSearch] as const;
    }, [history, location]);
}

export function usePage() {
    const history = useHistory();
    const location = useLocation();

    return React.useMemo(() => {
        const fragment = location.hash.substring(1); // remove the leading #

        const page = /[0-9]+/.test(fragment) ? fragment : null;
        function setPage(newPage: string | null, scroll = true) {
            if (newPage) {
                if (scroll) document.getElementById(newPage)?.scrollIntoView();
                history.push({...history.location, hash: "#" + newPage});
            } else history.push({...history.location, hash: undefined});
        }

        return [page, setPage] as const;
    }, [history, location]);
}

export function PageDocument({id}: {id: string}) {
    const [search, setSearch] = useSearch();
    const [page, setPage] = usePage();
    const history = useHistory();

    const isMobile = useMatchMedia("(max-width: 37rem)");
    const isInstalled = useIsInstalled();

    const searchInput = (
        <SearchInput
            initialValue={search.raw ?? ""}
            onSubmit={value => setSearch(value)}
            clearSearch={() => setSearch("")}
            className="Toolbar-grow"
        />
    );

    const numberInput = (
        <details className="details-with-Dialog">
            <summary className="Button" aria-label="Go To" title="Go To">
                #
            </summary>
            <GoToDialog goTo={pageId => setPage(pageId)} value={page} />
        </details>
    );

    return (
        <DisplayOptionsProvider id={id}>
            <Scrollbar
                // trackClickBehavior="step"
                removeTracksWhenNotUsed
                noDefaultStyles
                contentProps={{
                    renderer: ({elementRef, ...props}) => (
                        <main ref={elementRef} {...props} className="PageDocument" />
                    ),
                }}
            >
                <div className="Toolbar Toolbar--top">
                    <Link
                        to="/"
                        aria-label="Close"
                        title="Close"
                        className="Button close"
                    >
                        <CloseIcon />
                    </Link>
                    {isInstalled && (
                        <div className="Toolbar-group">
                            <button
                                className="Button"
                                aria-label="Back"
                                title="Back"
                                onClick={() => history.go(-1)}
                            >
                                <ArrowBackIcon />
                            </button>
                            <button
                                className="Button"
                                aria-label="Forward"
                                title="Forward"
                                onClick={() => history.go(1)}
                            >
                                <ArrowForwardIcon />
                            </button>
                        </div>
                    )}
                    {!isMobile && numberInput}
                    {!isMobile && searchInput}

                    <details className="details-with-Dialog">
                        <summary className="Button" aria-label="Indices" title="Indices">
                            <MenuIcon />
                        </summary>
                        <details-menu role="menu" class="Dialog Dialog--bottomLeft">
                            {Object.entries(indices).map(([id, name]) => (
                                <button
                                    key={id}
                                    type="button"
                                    role="menuitem"
                                    onMouseEnter={event =>
                                        (event.target as HTMLButtonElement).focus()
                                    }
                                >
                                    {name}
                                </button>
                            ))}
                        </details-menu>
                    </details>
                    <details className="details-with-Dialog">
                        <summary
                            className="Button"
                            aria-label="Display Options"
                            title="Display Options"
                        >
                            Aa
                        </summary>
                        <DisplayOptionsDialog />
                    </details>
                </div>

                {isMobile && (
                    <div className="Toolbar Toolbar--bottom">
                        {searchInput}
                        {numberInput}
                    </div>
                )}

                <DocumentView id={id} search={search} />
            </Scrollbar>
        </DisplayOptionsProvider>
    );
}

type SearchInputProps = {
    onSubmit: (newValue: string) => void;
    clearSearch: () => void;
    initialValue: string;
    className?: string;
};

function SearchInput({
    onSubmit,
    clearSearch,
    initialValue,
    className,
}: SearchInputProps) {
    const [value, setValue] = React.useState(initialValue);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <form
            title="Search"
            onSubmit={event => {
                event.preventDefault();
                onSubmit(value);
                inputRef.current!.blur();
            }}
            className={"Toolbar-group " + className}
        >
            <input
                className="Toolbar-grow"
                type="search"
                value={value}
                placeholder="Search"
                onFocus={e => e.target.select()}
                ref={inputRef}
                onChange={event => setValue(event.target.value)}
            />

            {/* <button
                className="Button"
                disabled={!value}
                onClick={event => {
                    event?.preventDefault();
                    setValue("");
                }}
                aria-label="Clear search"
                title="Clear search"
            >
                ✖
            </button> */}

            <button
                className="Button"
                onClick={event => {
                    event.preventDefault();
                    if (value) onSubmit(value);
                    else clearSearch();
                }}
                aria-label="Search"
                title="Search"
            >
                <SearchIcon />
            </button>
        </form>
    );
}
