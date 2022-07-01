import React from "react";
import { useQuery } from "react-query";

import * as types from "../types";
import * as bookService from "../bookService";
import { useAppState, setStateAndNavigate } from "../state";
import c from "../util/c";
import { usePending } from "../util/usePending";

import { FindDialogBase } from "./FindDialogBase";
import { searchIndex } from "../search";
import { useDebounceCallback } from "../util/useDebounceCallback";

import { ReactComponent as FoldIcon } from "../icons/fold.svg";
import { ReactComponent as UnfoldIcon } from "../icons/unfold.svg";
import { ReactComponent as ChevronIcon } from "../icons/chevron_right.svg";

type IndexReference = { id: types.HymnId; lines: string[] };

export let FindDialog = ({ book }: { book: types.Hymnal }) => {
    let [indexType, setIndexType] = useAppState(`book/${book.id}/currentIndex`, null);
    let [search, setSearch] = useAppState(`book/${book.id}/search`, "");
    let [loc] = useAppState(`book/${book.id}/loc`);

    let allIndexes = React.useMemo(() => getIndexes(book), [book]);
    let activeIndex = allIndexes.find(index => index.type === indexType) ?? null;

    let indexOfLines = useQuery(["indexOfLines", book.id], () =>
        bookService.getIndexOfLines(book.id)
    );
    let indexOfLinesIsLoading = usePending(indexOfLines.isLoading, 500, 700);

    let allReferences = React.useMemo(
        () => Object.keys(book.pages).map(id => ({ id, lines: [] as string[] })),
        [book]
    );

    let [references, setReferences] = React.useState(allReferences);

    let updateResults = React.useCallback(
        (searchString: string) => {
            if (indexOfLines.data && !indexOfLinesIsLoading)
                setReferences(searchBook(book, indexOfLines.data, searchString));
        },
        [book, indexOfLines.data, indexOfLinesIsLoading]
    );
    let updateResultsDebounced = useDebounceCallback(updateResults, 150);

    let prevSearch = React.useRef(search);
    React.useEffect(() => {
        prevSearch.current = search;
    });

    // Pre-existing search.
    // Synchronous so that we don't flash the full list before showing the filtered list.
    React.useLayoutEffect(() => {
        updateResults(prevSearch.current);
    }, [updateResults]);

    let onSearchChange = React.useCallback(
        (newSearch: string) => {
            setSearch(newSearch);
            if (newSearch.length >= 3) updateResultsDebounced(newSearch);
            else setReferences(allReferences);
        },
        [setSearch, updateResultsDebounced, allReferences]
    );

    let waitingForInput = usePending(search.length > 0 && search.length < 3, 1500, 300);

    let status =
        search.length > 0 && indexOfLinesIsLoading
            ? "Loading search index..."
            : indexOfLines.isError
            ? "Error loading search index"
            : waitingForInput
            ? "Type at least 3 letters to search"
            : undefined;

    return (
        <FindDialogBase
            allIndexes={allIndexes}
            initialIndex={activeIndex}
            onIndexChange={index => setIndexType(index?.type ?? null)}
            search={search}
            onSearchChange={onSearchChange}
        >
            {activeIndex ? (
                <Categories
                    book={book}
                    index={activeIndex}
                    references={references}
                    status={status}
                    activeSearch={search.length >= 3}
                />
            ) : (
                <div className="AllList">
                    <p
                        className="status"
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {status ||
                            `${references.length} hymn${
                                references.length !== 1 ? "s" : ""
                            }`}
                    </p>
                    <div className="content">
                        <ul className="ReferenceList">
                            {references.map((reference, i) => (
                                <Reference
                                    key={reference.id}
                                    page={book.pages[reference.id]}
                                    bookId={book.id}
                                    lines={reference.lines}
                                    isCurrent={loc === reference.id}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </FindDialogBase>
    );
};

function Categories({
    book,
    index,
    references,
    status,
    activeSearch,
}: {
    book: types.Hymnal;
    index: types.Index;
    references: IndexReference[];
    status?: string;
    activeSearch: boolean;
}) {
    let [loc] = useAppState(`book/${book.id}/loc`);
    let [sort, setSort] = useAppState(`book/${book.id}/index/${index.type}/sort`);
    let [expand, setExpand] = useAppState(`book/${book.id}/index/${index.type}/expand`, {
        all: false,
        except: [],
    });

    // Group references by category, according to the current index type
    let categories = React.useMemo(() => {
        type Category = {
            id: string;
            name: string | null;
            references: IndexReference[];
        };

        // Explicitly defined categories
        let definedCategories = Object.fromEntries(
            getIndexCategories(book, index.type).map(category => [
                category.id,
                { id: category.id, name: category.name, references: [] } as Category,
            ])
        );

        // Any new ad-hoc categories that don't have a referenced definition
        let adhoc = {} as Record<string, Category>;

        // "Other" category for uncategorized references
        let other = { id: "---", name: "(Uncategorized)", references: [] } as Category;

        for (let ref of references) {
            let page = book.pages[ref.id];
            if (!page) break;
            let categoryIds = getPageCategories(index.type, page);

            if (categoryIds.length === 0) other.references.push(ref);
            for (let id of categoryIds) {
                if (definedCategories[id]) {
                    definedCategories[id]!.references.push(ref);
                } else {
                    let newCategory = adhoc[id] ?? { id, name: null, references: [] };
                    adhoc[id] = newCategory;
                    newCategory.references.push(ref);
                }
            }
        }

        // Remove empty categories and put adhoc categories at the end by default
        let categories = [
            ...Object.values(definedCategories).filter(c => c.references.length > 0),
            ...Object.values(adhoc).sort((a, b) => a.id.localeCompare(b.id)),
        ];

        // If the categories aren't ordered by default, sort them alphabetically
        if (!index.hasDefaultSort || sort === "a-z")
            categories.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

        if (sort === "count")
            categories.sort((a, b) => b.references.length - a.references.length);

        // The "other" category always goes at the end
        if (other.references.length > 0) categories.push(other);

        // Use "[ID]" as the category name if the category is un-named
        let listWithNames = categories.map(({ id, name, references }) => ({
            id,
            name: name ?? `[${id}]`,
            references,
        }));

        return listWithNames;
    }, [book, index, references, sort]);

    return (
        <div className="IndexAccordion">
            <p className="status" role="status" aria-live="polite" aria-atomic="true">
                {status ||
                    `${references.length} hymns in ${categories.length} categories`}
            </p>

            <div className="sections">
                {categories.map(category => (
                    <details
                        key={category.id}
                        className={c(
                            "isCurrent",
                            loc !== null &&
                                category.references
                                    .map(reference => reference.id)
                                    .includes(loc)
                        )}
                        open={
                            activeSearch ||
                            expand.all ||
                            (!expand.all && expand.except.includes(category.id))
                        }
                        onToggle={event => {
                            if (!activeSearch) {
                                let open = (event.target as HTMLDetailsElement).open;
                                setExpand(prev => {
                                    if ((prev.all && !open) || (!prev.all && open)) {
                                        return {
                                            all: prev.all,
                                            except: [...prev.except, category.id],
                                        };
                                    }
                                    return {
                                        all: prev.all,
                                        except: prev.except.filter(
                                            e => e !== category.id
                                        ),
                                    };
                                });
                            }
                        }}
                    >
                        <summary>
                            <ChevronIcon aria-hidden className="openIndicator" />{" "}
                            <span className="label">{category.name}</span>
                            <span className="meta">
                                {loc !== null &&
                                    category.references
                                        .map(reference => reference.id)
                                        .includes(loc) && (
                                        <span
                                            className="status-current"
                                            title="Contains current page"
                                        >
                                            Contains current page
                                        </span>
                                    )}

                                <span className="count" aria-hidden>
                                    {category.references.length}
                                </span>
                                <span role="presentation" className="visually-hidden">
                                    {" "}
                                    contains {category.references.length} item
                                    {category.references.length !== 1 && "s"}
                                </span>
                            </span>
                        </summary>
                        <ul className="ReferenceList">
                            {category.references.map(reference => (
                                <Reference
                                    key={reference.id}
                                    page={book.pages[reference.id]!}
                                    bookId={book.id}
                                    lines={reference.lines}
                                    isCurrent={loc === reference.id}
                                />
                            ))}
                        </ul>
                    </details>
                ))}
            </div>

            <div className="row">
                <button
                    className="Button"
                    onClick={() => {
                        setExpand({ all: true, except: [] });
                    }}
                    aria-label="expand all"
                    title="Expand All"
                >
                    <UnfoldIcon aria-hidden />
                </button>
                <button
                    className="Button"
                    onClick={() => {
                        setExpand({ all: false, except: [] });
                    }}
                    aria-label="collapse all"
                    title="Collapse All"
                >
                    <FoldIcon aria-hidden />
                </button>

                <div className="expand" />

                <label htmlFor="sort-select">Sort:</label>
                <select
                    id="sort-select"
                    aria-label="Sort"
                    className="sortSelect"
                    value={sort}
                    onChange={event => setSort(event.target.value)}
                >
                    {index.hasDefaultSort && <option value="default">Default</option>}
                    <option value="a-z">A–Z</option>
                    <option value="count">Count</option>
                </select>
            </div>
        </div>
    );
}

function Reference({
    page,
    lines = [],
    isCurrent = false,
    bookId,
}: {
    page?: types.Hymn;
    lines?: string[];
    isCurrent?: boolean;
    bookId: string;
}) {
    if (!page) return null;

    return (
        <li className={c("is-current", isCurrent) + c("is-deleted", page.isDeleted)}>
            <span className="reference-id">
                {/* {page.topics[0] !== topic.id && "+"} */}
                {page.isRestricted && <span aria-label="restricted">*</span>}
                {page.id}
            </span>{" "}
            <a
                className="reference-title"
                href={`?book=${bookId}&loc=${page.id}`}
                onClick={event => {
                    event.preventDefault();
                    setStateAndNavigate(
                        prevState => ({
                            ...prevState,
                            "app/currentBook": bookId,
                            "app/mode": "read",
                            [`book/${bookId}/loc`]: page!.id,
                        }),
                        false
                    );
                }}
            >
                {page.title || "(no title)"}
            </a>
            {lines.length > 0 && (
                <ul className="reference-lines">
                    {lines.map((line, i) => (
                        <li key={i}>{line}</li>
                    ))}
                </ul>
            )}
        </li>
    );
}

function getIndexes(book: types.Hymnal | null) {
    if (!book) return [];
    return Object.values(book.indices).map(index => ({
        type: index.type,
        name: index.name,
        hasDefaultSort: index.hasDefaultSort,
    }));
}

function getIndexCategories(
    book: types.Hymnal,
    indexType: types.IndexType
): Array<{ id: string; name: string }> {
    switch (indexType) {
        case "topic":
            if (!book.topics) return [];
            return Object.values(book.topics);
        case "tune":
            if (!book.tunes) return [];
            return Object.values(book.tunes).map(tune => ({
                id: tune.id,
                name: tune.name || tune.id,
            }));
        case "author":
        case "translator":
            if (!book.contributors) return [];
            return Object.values(book.contributors);
        case "origin":
            if (!book.origins) return [];
            return Object.values(book.origins);
        case "days":
            if (!book.days) return [];
            return Object.values(book.days);
        case "language":
            if (!book.languages) return [];
            return Object.values(book.languages);
        default:
            return [];
    }
}

function getPageCategories(indexType: types.IndexType, page: types.Hymn): Array<string> {
    switch (indexType) {
        case "topic":
            return page.topics;
        case "tune":
            return page.tunes;
        case "author":
            return page.contributors
                .filter(c => c.type === "author" && c.id)
                .map(c => c.id!);
        case "translator":
            return page.contributors
                .filter(c => c.type === "translator" && c.id)
                .map(c => c.id!);
        case "origin":
            if (page.origin) return [page.origin];
            return [];
        case "days":
            return page.days;
        case "language":
            return [page.language];
        default:
            return [];
    }
}

function searchBook(book: types.Hymnal, indexOfLines: lunr.Index, searchString: string) {
    let searchTerms = [] as string[];
    let filterTerms = [] as [type: string, value: string | undefined][];

    searchString
        .trim()
        .split(" ")
        .filter(Boolean)
        .forEach(term => {
            if (term[0] === "#") {
                let [type, value] = term.slice(1).split("=", 2);
                filterTerms.push([type!, value]);
            } else {
                searchTerms.push(term);
            }
        });

    let results = [] as { id: string; lines: string[] }[];

    if (searchTerms.length > 0) {
        results = searchIndex(indexOfLines, book, searchTerms);
    } else {
        results = Object.values(book.pages).map(page => ({
            id: page.id,
            lines: [] as string[],
        }));
    }

    if (filterTerms.length > 0) {
        for (let [type, value] of filterTerms) {
            results = results.filter(({ id }) => {
                let page = book.pages[id];
                if (!page) return false;
                switch (type) {
                    case "topic":
                        if (!value) return page.topics.length > 0;
                        return page.topics.includes(value);
                    case "day":
                        if (!value) return page.days.length > 0;
                        return page.days.includes(value);
                    case "tune":
                        if (!value) return page.tunes.length > 0;
                        return page.tunes.includes(value);
                    case "origin":
                        if (!value) return !!page.origin;
                        return page.origin === value;
                    case "author": {
                        let authors = page.contributors
                            .filter(c => c.type === "author")
                            .map(c => c.id);
                        if (!value) return authors.length > 0;
                        return authors.includes(value);
                    }
                    case "transl": {
                        let translators = page.contributors
                            .filter(c => c.type === "translator")
                            .map(c => c.id);
                        if (!value) return translators.length > 0;
                        return translators.includes(value);
                    }
                    case "lang":
                        if (!value) return true;
                        return page.language === value;
                    case "deleted":
                        return page.isDeleted;
                    case "refrain":
                        return value === "yes" || value === undefined
                            ? page.refrain
                            : !page.refrain;
                    case "chorus":
                        return value === "yes" || value === undefined
                            ? page.chorus
                            : !page.chorus;
                    case "repeat": {
                        let hasRepeat =
                            page.verses.some(verse =>
                                verse.lines.some(
                                    lineOrRepeat => lineOrRepeat.kind === "repeat"
                                )
                            ) ||
                            page.chorus?.lines.some(
                                lineOrRepeat => lineOrRepeat.kind === "repeat"
                            ) ||
                            page.refrain?.lines.some(
                                lineOrRepeat => lineOrRepeat.kind === "repeat"
                            );

                        return value === "yes" || value === undefined
                            ? hasRepeat
                            : !hasRepeat;
                    }

                    default:
                        return true;
                }
            });
        }
    }

    return results;
}
