import React from "react";
import {
    Switch,
    Route,
    useRouteMatch,
    Link,
    useHistory,
    useLocation,
} from "react-router-dom";
// import {Scrollbar} from "react-scrollbars-custom";

// import {ReactComponent as MenuIcon} from "../assets/menu-24px.svg";
import {ReactComponent as SearchIcon} from "../assets/search-24px.svg";
import {ReactComponent as CloseIcon} from "../assets/close_black_24dp.svg";
import {ReactComponent as ArrowBackIcon} from "../assets/arrow_back_black_24dp.svg";
import {ReactComponent as ArrowForwardIcon} from "../assets/arrow_forward_black_24dp.svg";

import {useMatchMedia} from "../util/useMatchMedia";
import {useIsInstalled} from "../util/useIsInstalled";
import {DisplayOptionsDialog} from "./DisplayOptionsDialog";
import {DisplayOptionsProvider} from "./ContextDisplayOptions";
import {IndexDialog} from "./IndexDialog";
import {getDocument} from "../util/documentRepository";
import {HymnalDocument} from "../HymnalDocument";
import {Hymn} from "./Hymn";

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

    return React.useMemo(() => {
        const fragment = location.hash.substring(1); // remove the leading #

        const page = /[0-9]+/.test(fragment) ? fragment : null;
        function setPage(newPage: string | null, scroll = true) {
            if (newPage) {
                if (scroll)
                    document.getElementById(newPage)?.scrollIntoView({
                        inline: "start",
                    });
                history.push({...history.location, hash: "#" + newPage});
            } else history.push({...history.location, hash: undefined});
        }

        return [page, setPage] as const;
    }, [history, location]);
}

export function DocumentPage({id}: {id: string}) {
    let match = useRouteMatch();
    const hymnalDocument = React.useMemo(
        () => new HymnalDocument(getDocument(id).unwrap()),
        [id]
    );
    const indices = hymnalDocument.indices;

    const [search, setSearch] = useSearch();
    const [page, setPage] = usePage();
    const history = useHistory();

    const isMobile = useMatchMedia("(max-width: 37rem)");
    const isInstalled = useIsInstalled() && false;

    const documentRef = React.useRef<HTMLDivElement>(null!);
    const [pageN, setPageN] = React.useState(page);

    React.useEffect(() => {
        // An IntersectionObserver only reports what's *changed*, so keep a list
        const intersectionRatios: {[id: string]: number} = {};

        const observer = new IntersectionObserver(
            entries => {
                // Update the current intersectionRatio of each entry
                entries.forEach(entry => {
                    const id = entry.target.getAttribute("data-id");
                    if (id) intersectionRatios[id] = entry.intersectionRatio;
                });

                let main: string | null = null;
                Object.entries(intersectionRatios).forEach(([id, ratio]) => {
                    if (!main) main = id;
                    else if (intersectionRatios[main] < ratio) main = id;
                });
                setPageN(main);
            },
            {
                root: documentRef.current,
                threshold: [0, 0.25, 0.75, 1],
            }
        );

        [...documentRef.current.children].forEach(item => {
            observer.observe(item);
        });

        return () => observer.disconnect();
    }, []);

    const searchInput = (
        <SearchInput
            initialValue={search ?? ""}
            onSubmit={value => setSearch(value)}
            className="Toolbar-grow"
        />
    );

    const goToInput = (
        <GoToInput initialValue={pageN ?? "1"} onSubmit={page => setPage(page)} />
    );

    const allHymns = React.useMemo(() => hymnalDocument.getHymns(), [hymnalDocument]);
    const matchingHymns = React.useMemo(
        () => hymnalDocument.getHymns(search),
        [search, hymnalDocument]
    );

    const [groupBy, setGroupBy] = React.useState("topic");

    return (
        <DisplayOptionsProvider id={id}>
            {/* <Scrollbar
                // trackClickBehavior="step"
                removeTracksWhenNotUsed
                noDefaultStyles
                contentProps={{
                    renderer: ({elementRef, ...props}) => (
                        <main ref={elementRef} {...props} className="DocumentPage" />
                    ),
                }}
            > */}
            <main className="DocumentPage">
                <Switch>
                    {indices.map(index => (
                        <Route
                            key={index.id}
                            path={`${match.path}/${index.id}`}
                            render={() => (
                                <IndexDialog index={index} backURL={`/${id}`} />
                            )}
                        />
                    ))}
                </Switch>

                <div className="Toolbar Toolbar--top">
                    <Link
                        to="/"
                        aria-label="close book"
                        title="Close"
                        className="Button close"
                    >
                        <CloseIcon />
                    </Link>
                    {isInstalled && (
                        <div className="Toolbar-group">
                            <button
                                className="Button"
                                aria-label="back"
                                title="Back"
                                onClick={() => history.go(-1)}
                            >
                                <ArrowBackIcon />
                            </button>
                            <button
                                className="Button"
                                aria-label="forward"
                                title="Forward"
                                onClick={() => history.go(1)}
                            >
                                <ArrowForwardIcon />
                            </button>
                        </div>
                    )}
                    {!isMobile && searchInput}
                    {!isMobile && goToInput}

                    {/* <details className="details-with-Dialog">
                        <summary className="Button" aria-label="indices" title="Indices">
                            <MenuIcon />
                        </summary>
                        <details-menu role="menu" class="Dialog Dialog--bottomLeft">
                            {indices.map(index => (
                                <Link
                                    role="menuitem"
                                    onMouseEnter={event =>
                                        (event.target as HTMLButtonElement).focus()
                                    }
                                    key={index.id}
                                    to={`/${id}/${index.id}`}
                                >
                                    {index.name}
                                </Link>
                            ))}
                        </details-menu>
                    </details> */}
                    <details className="details-with-Dialog">
                        <summary
                            className="Button"
                            aria-label="display options"
                            title="Display Options"
                        >
                            Aa
                        </summary>
                        <DisplayOptionsDialog />
                    </details>
                </div>

                {isMobile && (
                    <div className="Toolbar Toolbar--bottom">
                        {goToInput}
                        {searchInput}
                    </div>
                )}

                <div className="Document" ref={documentRef}>
                    <div>
                        {search && (
                            <>
                                <p>
                                    {matchingHymns.length}{" "}
                                    {matchingHymns.length === 1 ? "result" : "results"}.
                                    Scroll right to view →
                                </p>
                                <p>
                                    <Link to={`/${id}`}>Clear search</Link>
                                </p>
                            </>
                        )}
                        <div>
                            <label htmlFor="groupby">Group By</label>
                            <select
                                id="groupby"
                                value={groupBy}
                                onChange={event => setGroupBy(event.target.value)}
                            >
                                <option value="topic">Topic</option>
                                <option value="tune">Tune</option>
                            </select>
                        </div>
                        <ul>
                            {matchingHymns.map(hymn => (
                                <li key={hymn.getAttribute("id")}>
                                    {hymn.getAttribute("id")}.{" "}
                                    {hymn.querySelector("title")?.textContent}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {allHymns.map(hymn => (
                        <div
                            data-id={hymn.getAttribute("id")}
                            key={hymn.getAttribute("id")!}
                            hidden={!matchingHymns.includes(hymn)}
                        >
                            <Hymn
                                node={hymn}
                                isAboveTheFold={matchingHymns.slice(0, 9).includes(hymn)}
                            />
                        </div>
                    ))}
                    {search && (
                        <div>
                            <p>No more results</p>
                            <p>
                                <Link to={`/${id}`}>Clear search</Link>
                            </p>
                        </div>
                    )}
                </div>
            </main>
            {/* </Scrollbar> */}
        </DisplayOptionsProvider>
    );
}

type SearchInputProps = {
    onSubmit: (newValue: string) => void;
    initialValue: string;
    className?: string;
};

function SearchInput({onSubmit, initialValue, className}: SearchInputProps) {
    const [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <form className={"Toolbar-group " + className}>
            <input
                type="search"
                value={value}
                onFocus={e => e.target.select()}
                onChange={event => setValue(event.target.value)}
                className="Toolbar-grow"
                placeholder="Search"
                aria-label="search"
            />
            <button
                type="submit"
                onClick={event => {
                    event.preventDefault();
                    onSubmit(value);
                }}
                className="Button"
                aria-label="submit search"
                title="Search"
            >
                <SearchIcon />
            </button>
        </form>
    );
}

type GoToInputProps = {
    onSubmit: (newValue: string) => void;
    initialValue: string;
    className?: string;
};

function GoToInput({onSubmit, initialValue, className}: GoToInputProps) {
    const [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <form className={"Toolbar-group " + className}>
            <input
                type="number"
                value={value}
                onFocus={e => e.target.select()}
                onChange={event => setValue(event.target.value)}
                className="Toolbar-grow"
                aria-label="page number"
            />
            <button
                type="submit"
                onClick={event => {
                    event.preventDefault();
                    onSubmit(value);
                }}
                className="Button"
                aria-label="go to page"
                title="Go To"
            >
                #
            </button>
        </form>
    );
}
