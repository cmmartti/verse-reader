import React from "react";
import { useQuery } from "react-query";

import * as types from "../types";
import * as bookService from "../bookService";
import { searchIndex } from "../search";

import { usePending } from "../util/usePending";
import { useDebounceCallback } from "../util/useDebounceCallback";

type Status = "ready" | "error" | "waiting" | "loading" | "success";
type Reference = { id: types.HymnId; lines: string[] };
type Category = {
    id: string;
    name: string | null;
    references: Reference[];
};

export function useIndex({
    book,
    groupBy,
    sort,
    search,
    minSearchLength,
}: {
    book: types.Hymnal;
    groupBy: types.Index;
    sort: string;
    search: string;
    minSearchLength: number;
}): {
    status: Status;
    categories: {
        id: string;
        name: string;
        references: Reference[];
    }[];
    references: Reference[];
} {
    let indexOfLines = useQuery(["indexOfLines", book.id], () =>
        bookService.getIndexOfLines(book.id)
    );
    let indexOfLinesIsLoading = usePending(indexOfLines.isLoading, 500, 700);
    let waitingForInput = usePending(
        search.length > 0 && search.length < minSearchLength,
        1500,
        300
    );

    let status: Status = "ready";
    if (search.length > 0 && indexOfLinesIsLoading) status = "loading";
    else if (indexOfLines.isError) status = "error";
    else if (waitingForInput) status = "waiting";
    else if (search.length >= minSearchLength) status = "success";

    let allReferences = React.useMemo(
        () => Object.keys(book.pages).map(id => ({ id, lines: [] } as Reference)),
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

    // let prevSearch = React.useRef(search);
    // React.useEffect(() => {
    //     prevSearch.current = search;
    // });

    // Pre-existing search. Use a synchronous effect to avoid a Flash of Unfiltered List
    // React.useLayoutEffect(() => {
    //     updateResults(prevSearch.current);
    // }, [updateResults]);

    React.useEffect(() => {
        if (search.length >= minSearchLength) updateResultsDebounced(search);
        else setReferences(allReferences);
    }, [search, updateResultsDebounced, allReferences, minSearchLength]);

    // Group references by category, according to the current index type
    let categories = React.useMemo(() => {
        // Explicitly defined categories
        let definedCategories: Record<string, Category> = {};
        for (let { id, name } of getCategories(book, groupBy.type)) {
            definedCategories[id] = { id, name, references: [] };
        }

        // Any ad-hoc categories that don't have a referenced definition
        let adhoc: Record<string, Category> = {};

        // "Other" category for uncategorized references
        let other: Category = { id: "---", name: "(Uncategorized)", references: [] };

        // Determine to which categories each reference belongs
        for (let ref of references) {
            let page = book.pages[ref.id];
            if (!page) break;
            let categoryIds = getPageCategories(groupBy.type, page);

            if (categoryIds.length === 0) other.references.push(ref);
            for (let id of categoryIds) {
                if (definedCategories[id]) {
                    definedCategories[id]!.references.push(ref);
                } else {
                    adhoc[id] = adhoc[id] ?? { id, name: null, references: [] };
                    adhoc[id]!.references.push(ref);
                }
            }
        }

        // Remove empty categories and put adhoc categories at the end by default
        let categories = [
            ...Object.values(definedCategories).filter(c => c.references.length > 0),
            ...Object.values(adhoc).sort((a, b) => a.id.localeCompare(b.id)),
        ];

        // If the categories aren't ordered by default, sort them alphabetically
        if (!groupBy.hasDefaultSort || sort === "a-z")
            categories.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

        if (sort === "count")
            categories.sort((a, b) => b.references.length - a.references.length);

        // The "other" category always goes at the end
        if (other.references.length > 0) categories.push(other);

        // Use the ID as the category name if the category is un-named
        return categories.map(({ id, name, references }) => ({
            id,
            name: name ?? `[${id}]`,
            references,
        }));
    }, [book, sort, references, groupBy]);

    return {
        status,
        categories,
        references,
    };
}

function getCategories(
    book: types.Hymnal,
    groupBy: types.IndexType
): Array<{ id: string; name: string | null }> {
    switch (groupBy) {
        case "_none":
            return [{ id: "_none", name: null }];
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

function getPageCategories(groupBy: types.IndexType, page: types.Hymn): Array<string> {
    switch (groupBy) {
        case "_none":
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
                    case "restricted":
                        return page.isRestricted;
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
                                    lineOrRepeat =>
                                        typeof lineOrRepeat !== "string" &&
                                        lineOrRepeat.kind === "repeat"
                                )
                            ) ||
                            page.chorus?.lines.some(
                                lineOrRepeat =>
                                    typeof lineOrRepeat !== "string" &&
                                    lineOrRepeat.kind === "repeat"
                            ) ||
                            page.refrain?.lines.some(
                                lineOrRepeat =>
                                    typeof lineOrRepeat !== "string" &&
                                    lineOrRepeat.kind === "repeat"
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
