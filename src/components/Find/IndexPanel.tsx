import React from "react";

import * as types from "../../types";
import { useCurrentPage } from "../../util/useCurrentPage";
import { ReactComponent as FoldIcon } from "../../icons/fold.svg";
import { ReactComponent as UnfoldIcon } from "../../icons/unfold.svg";
import { setStateAndNavigate, useAppState } from "../../state";
import c from "../../util/c";

export function IndexPanel({ book }: { book: types.HymnalDocument }) {
    let indices = [
        ...Object.values(book?.indices ?? []),
        { name: "All", type: "all", hasDefaultSort: false },
    ];

    let [currentIndexType, setCurrentIndexType] = useAppState(
        `book/${book.id}/currentIndex`,
        indices[0]!.type
    );

    let currentIndex =
        indices.find(index => index.type === currentIndexType) ?? indices[0]!;

    return (
        <div className="IndexPanel">
            <select
                className="indexSelect"
                aria-label="index"
                title="Index"
                value={currentIndexType}
                onChange={e => setCurrentIndexType(e.target.value)}
            >
                {indices.length === 0 && <option>None</option>}
                {indices.map(index => (
                    <option key={index.type} value={index.type}>
                        {index.name}
                    </option>
                ))}
            </select>

            {book !== null && (
                <Index
                    key={currentIndex.type}
                    book={book}
                    indexType={currentIndex.type}
                    hasDefaultSort={currentIndex.hasDefaultSort}
                />
            )}
        </div>
    );
}

let getKey = (element: Element) => element.getAttribute("data-id")!;

function Index({
    book,
    indexType,
    hasDefaultSort,
}: {
    book: types.HymnalDocument;
    indexType: types.IndexType;
    hasDefaultSort: boolean;
}) {
    let [sort, setSort] = useAppState(
        `book/${book?.id}/index/${indexType}/sort`,
        "default"
    );
    let [scrollPosition, setScrollPosition] = useAppState(
        `book/${book?.id}/index/${indexType}/scrollPosition`,
        null
    );
    let [defaultExpand, setDefaultExpand] = useAppState(
        `book/${book?.id}/index/${indexType}/defaultExpand`,
        false
    );
    let [expandedEntries, setExpandedEntries] = useAppState(
        `book/${book?.id}/index/${indexType}/expandedEntries`,
        {}
    );

    let entries = React.useMemo(() => {
        if (book === null) return [];
        let entries = getIndexEntries(book, indexType);

        if (sort === "a-z" || !hasDefaultSort)
            entries.sort((a, b) => a.name.localeCompare(b.name));

        if (sort === "count")
            entries.sort((a, b) => b.references.length - a.references.length);

        return entries;
    }, [sort, book, indexType, hasDefaultSort]);

    let ref = React.useRef<HTMLUListElement>(null!);

    let keys = React.useMemo(() => entries.map(entry => entry.id), [entries]);

    useCurrentPage({
        ref,
        keys,
        getKey,
        initialPage: scrollPosition,
        onChange: setScrollPosition,
    });

    return (
        <>
            <div className="expand-controls">
                <button
                    className="Button"
                    onClick={() => {
                        setDefaultExpand(true);
                        setExpandedEntries({});
                    }}
                    aria-label="expand all"
                    title="Expand All"
                    disabled={entries.length === 0}
                >
                    <UnfoldIcon />
                </button>
                <button
                    className="Button"
                    onClick={() => {
                        setDefaultExpand(false);
                        setExpandedEntries({});
                    }}
                    aria-label="collapse all"
                    title="Collapse All"
                    disabled={entries.length === 0}
                >
                    <FoldIcon />
                </button>

                <div className="spring" />

                <label htmlFor="sort-select">Sort:</label>
                <select
                    id="sort-select"
                    aria-label="Sort"
                    className="sortSelect"
                    value={sort}
                    onChange={event => setSort(event.target.value)}
                    disabled={entries.length === 0}
                >
                    {hasDefaultSort && <option value="default">Default</option>}
                    <option value="a-z">A–Z</option>
                    <option value="count">Count</option>
                </select>
            </div>

            <ul className="entries" key={indexType} ref={ref}>
                {entries.map(entry => (
                    <li key={entry.id} data-id={entry.id}>
                        <IndexEntry
                            book={book!}
                            entry={entry}
                            initialOpen={
                                entries.length === 1 ||
                                (expandedEntries?.[entry.id] ?? defaultExpand ?? false)
                            }
                            onToggle={open =>
                                setExpandedEntries({
                                    ...expandedEntries,
                                    [entry.id]: open,
                                })
                            }
                        />
                    </li>
                ))}
            </ul>
        </>
    );
}

let IndexEntry = React.memo(_IndexEntry);

function _IndexEntry({
    book,
    entry,
    initialOpen,
    onToggle,
}: {
    book: types.HymnalDocument;
    entry: { name: string; id: string; references: types.HymnId[] };
    initialOpen: boolean;
    onToggle: (open: boolean) => void;
}) {
    let [loc] = useAppState(`book/${book.id}/loc`);
    let isCurrent = false;
    if (loc !== null) isCurrent = entry.references.includes(loc);

    return (
        <details
            className={"entry" + c("is-current", isCurrent)}
            open={initialOpen}
            onToggle={event => {
                let open = (event.target as HTMLDetailsElement).open;
                if (initialOpen !== open) onToggle(open);
            }}
        >
            <summary>
                <h3 className="entry-title">{entry.name} </h3>
                <span>{entry.references.length}</span>
            </summary>

            <ul className="entry-references">
                {entry.references.map(item => {
                    let hymn = book.hymns[item];
                    if (hymn === undefined) return null;

                    let hymnId = hymn.id;
                    return (
                        <li key={hymn.id}>
                            <a
                                href={`?book=${book.id}&loc=${hymn.id}`}
                                onClick={event => {
                                    event.preventDefault();
                                    setStateAndNavigate(prevState => ({
                                        ...prevState,
                                        "app/currentBook": book.id,
                                        [`book/${book.id}/loc`]: hymnId,
                                    }));
                                }}
                                className={
                                    "reference" +
                                    c("is-current", loc === hymn.id) +
                                    c("is-deleted", hymn.isDeleted)
                                }
                            >
                                <span className="reference-id">
                                    {/* {hymn.topics[0] !== topic.id && "+"} */}
                                    {hymn.isRestricted && (
                                        <span aria-label="restricted">*</span>
                                    )}
                                    {hymn.id}
                                </span>{" "}
                                <span className="reference-title">
                                    {hymn.title || "(no title)"}
                                </span>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </details>
    );
}

function getIndexEntries(document: types.HymnalDocument, indexType: types.IndexType) {
    switch (indexType) {
        case "all":
            return [
                {
                    name: "All",
                    id: "all",
                    references: Object.values(document.hymns).map(hymn => hymn.id),
                },
            ];

        case "topic":
            if (!document.topics) return [];
            return Object.values(document.topics).map(topic => ({
                name: topic.name,
                id: topic.id,
                references: Object.values(document.hymns)
                    .filter(hymn => hymn.topics.includes(topic.id))
                    .map(hymn => hymn.id),
            }));

        case "author":
            return [
                ...new Set(
                    Object.values(document.hymns).flatMap(hymn =>
                        hymn.authors.map(author => author.name)
                    )
                ),
            ].map(authorName => ({
                name: authorName || "?",
                id: authorName || "?",
                references: Object.values(document.hymns)
                    .filter(hymn =>
                        hymn.authors.map(author => author.name).includes(authorName)
                    )
                    .map(hymn => hymn.id),
            }));

        case "translator":
            return [
                ...new Set(
                    Object.values(document.hymns).flatMap(hymn =>
                        hymn.translators.map(translator => translator.name)
                    )
                ),
            ].map(translatorName => ({
                name: translatorName || "?",
                id: translatorName || "?",
                references: Object.values(document.hymns)
                    .filter(hymn =>
                        hymn.translators
                            .map(translator => translator.name)
                            .includes(translatorName)
                    )
                    .map(hymn => hymn.id),
            }));

        case "tune":
            if (!document.tunes) return [];
            return Object.values(document.tunes).map(tune => ({
                name: tune.name || tune.id,
                id: tune.id,
                references: Object.values(document.hymns)
                    .filter(hymn => hymn.tunes.includes(tune.id))
                    .map(hymn => hymn.id),
            }));

        case "language":
            return Object.values(document.languages).map(language => ({
                name: language.name,
                id: language.id,
                references: Object.values(document.hymns)
                    .filter(hymn => hymn.language === language.id)
                    .map(hymn => hymn.id),
            }));

        case "origin":
            return (
                [...new Set(Object.values(document.hymns).map(hymn => hymn.origin))]
                    // .filter(Boolean)
                    .map(origin => ({
                        name: origin || "?",
                        id: origin || "?",
                        references: Object.values(document.hymns)
                            .filter(hymn => hymn.origin === origin)
                            .map(hymn => hymn.id),
                    }))
            );

        case "calendar":
            if (!document.calendar) return [];
            return Object.values(document.calendar).map(day => ({
                name: day.shortName || day.name,
                id: day.id,
                references: Object.values(document.hymns)
                    .filter(hymn => hymn.days.includes(day.id))
                    .map(hymn => hymn.id),
            }));

        default:
            return [];
    }
}
