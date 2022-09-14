import React from "react";

import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { Link, useMatch, useNavigate, useSearch } from "@tanstack/react-location";
import { ReactComponent as ChevronIcon } from "../icons/chevron_right.svg";

import * as types from "../types";
import { useAppState } from "../state";
import c from "../util/c";

import { NavigationBar } from "./NavigationBar";
import { LocationGenerics } from "./App";
import { Menu } from "./Menu";
import { useIndex } from "./useIndex";
import { SearchBar } from "./SearchBar";

export function BookIndex() {
    let match = useMatch();
    let book = match.data.file! as types.Hymnal;

    // let navigate = useNavigate();
    let query = useSearch<LocationGenerics>();
    let loc = query.loc ? query.loc.toString() : null;
    // let search = query.q ?? "";

    let [search, setSearch] = React.useState("");

    let groupByOptions = React.useMemo(
        () => [
            {
                type: "_none",
                name: "None",
                hasDefaultSort: true,
            },
            ...Object.values(book.indices).sort((a, b) => a.name.localeCompare(b.name)),
        ],
        [book]
    );

    let [_groupBy, setGroupBy] = useAppState(`book/${book.id}/currentIndex`, "_none");
    let groupBy =
        groupByOptions.find(groupBy => groupBy.type === _groupBy) ?? groupByOptions[0]!;

    let [sort, setSort] = useAppState(`book/${book.id}/index/${groupBy.type}/sort`);

    let [expand, setExpand] = useAppState(
        `book/${book.id}/index/${groupBy.type}/expand`,
        { all: false, except: [] }
    );

    let [expandedCategories, setExpandedCategories] = React.useReducer(
        (
            state: { all: boolean; except: string[] },
            action:
                | { type: "toggle"; id: string; value: boolean }
                | { type: "toggle_all"; value: boolean }
        ) => {
            switch (action.type) {
                case "toggle":
                    return {
                        ...state,
                        except: { ...state.except, [action.id]: action.value },
                    };
                case "toggle_all":
                    return { all: action.value, except: [] };
                default:
                    return state;
            }
        },
        expand
    );

    let { categories, references, status } = useIndex({
        book,
        groupBy,
        sort,
        search,
        minSearchLength: 3,
    });

    let statusMessage = `${references.length} hymn${references.length !== 1 ? "s" : ""}`;
    if (groupBy.type !== "_none") {
        statusMessage += ` in ${categories.length} categories`;
    }

    if (status === "loading") {
        statusMessage = "Loading search index...";
    } else if (status === "error") {
        statusMessage = "Error loading search index";
    } else if (status === "waiting") {
        statusMessage = "Type at least 3 letters to search";
    } else if (status === "success") {
        statusMessage = `${references.length} match${
            references.length !== 1 ? "es" : ""
        }`;
        if (groupBy.type !== "_none" && references.length > 0) {
            statusMessage += ` in ${categories.length} categories`;
        }
    }

    let menu = (
        <Menu label={<MoreIcon />} buttonProps={{ class: "Button" }}>
            <button role="menuitem" onClick={() => setExpand({ all: true, except: [] })}>
                Expand All
            </button>
            <button
                role="menuitem"
                onClick={() => setExpand({ all: false, except: [] })}
            >
                Collapse All
            </button>

            <div role="separator" />

            {groupByOptions.map(index => (
                <button
                    role="menuitemradio"
                    key={index.type}
                    onClick={() => setGroupBy(index.type)}
                    aria-checked={index.type === groupBy.type}
                >
                    {index.type === groupBy.type && "✓"} {index.name}
                </button>
            ))}

            {groupBy.type !== "_none" && (
                <React.Fragment>
                    <div role="separator" />

                    <button
                        role="menuitemradio"
                        onClick={() => setSort?.("default")}
                        aria-checked={sort === "default"}
                    >
                        {sort === "default" && "✓"} Default
                    </button>
                    <button
                        role="menuitemradio"
                        onClick={() => setSort?.("a-z")}
                        aria-checked={sort === "a-z"}
                    >
                        {sort === "a-z" && "✓"} A→Z
                    </button>
                    <button
                        role="menuitemradio"
                        onClick={() => setSort?.("count")}
                        aria-checked={sort === "count"}
                    >
                        {sort === "count" && "✓"} Count
                    </button>
                </React.Fragment>
            )}
        </Menu>
    );

    let resultsRef = React.useRef<HTMLDivElement>(null!);
    return (
        <main className="BookIndex">
            <NavigationBar
                back={{ to: "/" + book.id, title: book.id }}
                title="Index"
                tools={menu}
                // search={}
            />
            <SearchBar
                value={search}
                onChange={value => {
                    resultsRef.current.scrollTo({ top: 0 });
                    setSearch(value);
                }}
                onSubmit={() => resultsRef.current.focus()}
                placeholder={"Find in " + book.title}
            />

            <div
                key={groupBy.type} // don't reuse this element
                className={"-results" + c("--grouped", groupBy.type !== "_none")}
                tabIndex={-1}
                ref={resultsRef}
            >
                <p
                    className="status"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {statusMessage}
                </p>

                {groupBy.type === "_none" ? (
                    <ul className="ReferenceList unlist">
                        {references.map(reference => (
                            <li key={reference.id}>
                                <Reference
                                    page={book.pages[reference.id]!}
                                    book={book}
                                    lines={reference.lines}
                                    isCurrent={loc === reference.id}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="unlist">
                        {categories.map(category => (
                            <li key={category.id}>
                                <IndexSection
                                    key={category.id}
                                    title={category.name}
                                    items={category.references}
                                    renderItem={reference => (
                                        <Reference
                                            page={book.pages[reference.id]!}
                                            book={book}
                                            lines={reference.lines}
                                            isCurrent={loc === reference.id}
                                        />
                                    )}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}

type Identifiable = { id: string };

function IndexSection<T extends Identifiable>({
    current = false,
    open = true,
    title,
    items,
    renderItem,
}: {
    current?: boolean;
    open?: boolean;
    title: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
}) {
    let [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
        setIsOpen(open);
    }, [open]);

    return (
        <div className={"Section" + c("--current", current) + c("--open", isOpen)}>
            <h2 className="-header">
                <button
                    className="-button unbutton"
                    onClick={() => setIsOpen(open => !open)}
                >
                    {current && (
                        <span className="-marker" aria-label="contains current page" />
                    )}
                    <span className="-title">{title}</span>
                    <span
                        className="-count"
                        aria-label={`${items.length} item${items.length !== 1 && "s"}`}
                    >
                        {items.length}
                    </span>
                    <ChevronIcon aria-hidden className="-arrow" />
                </button>
            </h2>

            <div className="-contents">
                <ul className="-items unlist">
                    {items.map(item => (
                        <li key={item.id}>{renderItem(item)}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

function Reference({
    page,
    lines = [],
    isCurrent = false,
    book,
}: {
    page?: types.Hymn;
    lines?: string[];
    isCurrent?: boolean;
    book: types.Hymnal;
}) {
    if (!page) return null;

    return (
        <Link
            className={
                "ReferenceLink" +
                c("is-current", isCurrent) +
                c("is-deleted", page.isDeleted) +
                c("is-otherLanguage", page.language !== book.language)
            }
            to={`/${book.id}?loc=${page.id}`}
        >
            <div className="icon">{page.id}</div>

            <div className="label">
                <div className="title">
                    {page.isRestricted && "*"}
                    {page.title || "(no title)"}
                </div>
                <span className="spacer" />
                {/* <div className="verseCount subdued">
          {page.verses.length}&nbsp;verses
          {page.chorus && ", chorus"}
          {page.refrain && ", refrain"}
        </div> */}
                {/* <div className="verseCount subdued">
          {page.tunes
            .map(
              tuneId =>
                book.tunes?.[tuneId] ?? {
                  id: tuneId,
                  name: tuneId,
                }
            )
            .map((tune, index) => {
              return (
                <React.Fragment key={tune.id}>
                  {tune.name || tune.id}
                  {index < page.tunes.length - 1 && ", "}
                </React.Fragment>
              );
            })}
        </div> */}
            </div>

            {lines.length > 0 && (
                <ol className="preview">
                    {lines.map((line, i) => (
                        <li key={i}>
                            {/* <span aria-hidden>→ </span> */}
                            {line}
                        </li>
                    ))}
                </ol>
            )}
        </Link>
    );
}
