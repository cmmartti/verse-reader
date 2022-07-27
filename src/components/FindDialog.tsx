import React from "react";
import { useQuery } from "react-query";

import * as types from "../types";
import * as bookService from "../bookService";
import { useAppState } from "../state";
import c from "../util/c";
import { usePending } from "../util/usePending";
import { ReactComponent as TriangleIcon } from "../icons/triangle.svg";

import { FindDialogBase } from "./FindDialogBase";
import { searchIndex } from "../search";
import { useDebounceCallback } from "../util/useDebounceCallback";

import { navigate, useLocationState } from "../locationState";

type IndexReference = { id: types.HymnId; lines: string[] };

export let FindDialog = ({
    book,
    open,
    onClose,
}: {
    book: types.Hymnal;
    open: boolean;
    onClose?: () => void;
}) => {
    let [search, setSearch] = useLocationState(`book/${book.id}/search`, "");
    let [loc] = useLocationState(`book/${book.id}/loc`);

    let [indexType, setIndexType] = useAppState(`book/${book.id}/currentIndex`, "_all");
    let [sort, setSort] = useAppState(`book/${book.id}/index/${indexType}/sort`);
    let [expand, setExpand] = useAppState(`book/${book.id}/index/${indexType}/expand`, {
        all: false,
        except: [],
    });

    let allIndexes = React.useMemo(() => getIndexes(book), [book]);
    let activeIndex =
        allIndexes.find(index => index.type === indexType) ?? allIndexes[0]!;

    let indexOfLines = useQuery(["indexOfLines", book.id], () =>
        bookService.getIndexOfLines(book.id)
    );
    let indexOfLinesIsLoading = usePending(indexOfLines.isLoading, 500, 700);

    let allReferences = React.useMemo(
        () => Object.keys(book.pages).map(id => ({ id, lines: [] as string[] })),
        [book]
    );
    let [references, setReferences] = React.useState(allReferences);

    // Group references by category, according to the current index type
    let categories = React.useMemo(() => {
        if (!activeIndex) return [];

        type Category = {
            id: string;
            name: string | null;
            references: IndexReference[];
        };

        // Explicitly defined categories
        let definedCategories = Object.fromEntries(
            getIndexCategories(book, activeIndex.type).map(category => [
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
            let categoryIds = getPageCategories(activeIndex.type, page);

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
        if (!activeIndex.hasDefaultSort || sort === "a-z")
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
    }, [book, sort, references, activeIndex]);

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

    let status = "";

    if (search.length > 0 && indexOfLinesIsLoading) {
        status = "Loading search index...";
    } else if (indexOfLines.isError) {
        status = "Error loading search index";
    } else if (waitingForInput) {
        status = "Type at least 3 letters to search";
    } else if (search.length > 3) {
        status = `${references.length} match${references.length !== 1 ? "es" : ""}`;
        if (indexType !== "_all") {
            status += ` in ${categories.length} categories`;
        }
    }

    let activeSearch = search.length >= 3;

    return (
        <FindDialogBase
            open={open}
            onClose={onClose}
            allIndexes={allIndexes}
            initialIndex={activeIndex}
            onIndexChange={index => setIndexType(index?.type ?? null)}
            search={search}
            onSearchChange={onSearchChange}
            sort={sort}
            setSort={setSort}
            expandAll={() => setExpand({ all: true, except: [] })}
            collapseAll={() => setExpand({ all: false, except: [] })}
        >
            {status && (
                <p
                    className="status"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {status}
                </p>
            )}

            {indexType === "_all" ? (
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
            ) : (
                <div className="IndexAccordion">
                    {categories.map(category => {
                        let isCurrent =
                            loc !== null &&
                            category.references
                                .map(reference => reference.id)
                                .includes(loc);
                        return (
                            <details
                                key={category.id}
                                className={c("isCurrent", isCurrent)}
                                open={
                                    activeSearch ||
                                    expand.all ||
                                    (!expand.all && expand.except.includes(category.id))
                                }
                                onToggle={event => {
                                    if (!activeSearch) {
                                        let open = (event.target as HTMLDetailsElement)
                                            .open;

                                        if (
                                            (expand.all && !open) ||
                                            (!expand.all && open)
                                        ) {
                                            setExpand({
                                                all: expand.all,
                                                except: [...expand.except, category.id],
                                            });
                                        } else {
                                            setExpand({
                                                all: expand.all,
                                                except: expand.except.filter(
                                                    e => e !== category.id
                                                ),
                                            });
                                        }

                                        // setExpand(prev => {
                                        //     if (
                                        //         (prev.all && !open) ||
                                        //         (!prev.all && open)
                                        //     ) {
                                        //         return {
                                        //             all: prev.all,
                                        //             except: [
                                        //                 ...prev.except,
                                        //                 category.id,
                                        //             ],
                                        //         };
                                        //     }
                                        //     return {
                                        //         all: prev.all,
                                        //         except: prev.except.filter(
                                        //             e => e !== category.id
                                        //         ),
                                        //     };
                                        // });
                                    }
                                }}
                            >
                                <summary>
                                    <TriangleIcon
                                        aria-hidden
                                        className="openIndicator"
                                    />
                                    <span className="label">{category.name}</span>
                                    {isCurrent && (
                                        <span
                                            className="visually-hidden"
                                            role="presentation"
                                        >
                                            Contains current page
                                        </span>
                                    )}
                                    <span className="count" aria-hidden>
                                        {category.references.length}
                                    </span>
                                    <span
                                        role="presentation"
                                        className="visually-hidden"
                                    >
                                        {" "}
                                        contains {category.references.length} item
                                        {category.references.length !== 1 && "s"}
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
                        );
                    })}
                </div>
            )}
        </FindDialogBase>
    );
};

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
        <li>
            <a
                className={
                    "reference-contents" +
                    c("is-current", isCurrent) +
                    c("is-deleted", page.isDeleted)
                }
                href={`?book=${bookId}&loc=${page.id}`}
                onClick={event => {
                    event.preventDefault();
                    navigate(
                        prevState => ({
                            ...prevState,
                            book: bookId,
                            sidebar: null,
                            [`book/${bookId}/loc`]: page!.id,
                        }),
                        false
                    );
                }}
            >
                <span className="reference-label">
                    <span className="reference-id">
                        {page.isRestricted && <span aria-label="restricted">*</span>}
                        {page.id}
                    </span>{" "}
                    <span className="reference-title">{page.title || "(no title)"}</span>
                </span>

                {lines.length > 0 && (
                    <ul className="reference-lines">
                        {lines.map((line, i) => (
                            <li key={i}>{line}</li>
                        ))}
                    </ul>
                )}
            </a>
        </li>
    );
}

function getIndexes(book: types.Hymnal | null) {
    if (!book) return [];
    return [
        { type: "_all", name: "Index", hasDefaultSort: true },
        ...Object.values(book.indices).map(index => ({
            type: index.type,
            name: index.name,
            hasDefaultSort: index.hasDefaultSort,
        })),
    ];
}

function getIndexCategories(
    book: types.Hymnal,
    indexType: types.IndexType
): Array<{ id: string; name: string }> {
    switch (indexType) {
        case "_all":
            return [{ id: "_", name: "_" }];
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
        case "_all":
            return ["_"];
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
