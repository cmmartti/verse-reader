import React from "react";
import { Link } from "@tanstack/react-location";

import * as types from "../../types";

export function IndexPanel({ document }: { document: types.HymnalDocument }) {
    let [groupBy, setGroupBy] = React.useState("topic");
    let indices = React.useMemo(
        () =>
            indexGetters
                .map(indexGetter => indexGetter(document))
                .filter(Boolean)
                .map(index => index as Index),
        [document]
    );

    let [initialOpen, setInitialOpen] = React.useState(true);
    return (
        <div className="IndexPanel">
            <div className="controls">
                <label htmlFor="index-select" className="visually-hidden">
                    Index
                </label>
                <select
                    aria-label="index"
                    title="Index"
                    value={groupBy}
                    onChange={e => {
                        setGroupBy(e.target.value);
                    }}
                >
                    {indices.map(index => (
                        <option key={index.type} value={index.type}>
                            {index.name}
                        </option>
                    ))}
                </select>

                <ul className="controls-inline">
                    <li>
                        <button className="Button" onClick={() => setInitialOpen(true)}>
                            Expand All
                        </button>
                    </li>
                    <li>
                        <button className="Button" onClick={() => setInitialOpen(false)}>
                            Collapse All
                        </button>
                    </li>
                </ul>
            </div>

            <ul className="entries">
                {indices.map(index => {
                    if (index.type !== groupBy) return null;
                    return index.entries.map(entry => (
                        <li className="entry" key={entry.id}>
                            <details open={initialOpen}>
                                <summary className="entry-title">
                                    <h3>{entry.name} </h3>
                                    <span>{entry.list.length}</span>
                                </summary>

                                <ul className="entry-references">
                                    {entry.list.map(item => {
                                        let hymn = document.hymns[item];
                                        return (
                                            <li
                                                key={hymn.id}
                                                className="entry-reference"
                                            >
                                                <b>
                                                    {/* {hymn.topics[0] !== topic.id && "+"} */}
                                                    {hymn.isRestricted && (
                                                        <span aria-hidden>*</span>
                                                    )}
                                                    <span className="visually-hidden">
                                                        number
                                                    </span>
                                                    {hymn.id}:
                                                    {hymn.isRestricted && (
                                                        <span className="visually-hidden">
                                                            restricted *
                                                        </span>
                                                    )}
                                                </b>{" "}
                                                <Link to={`/${document.id}/${hymn.id}`}>
                                                    {hymn.title}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </details>
                        </li>
                    ));
                })}
            </ul>
        </div>
    );
}

type Index = {
    type: string;
    name: string;
    entries: {
        name: string;
        id: string;
        list: types.HymnId[];
    }[];
};

type IndexGetter = (hymnal: types.HymnalDocument) => null | Index;

let indexGetters: IndexGetter[] = [
    hymnal => {
        if (!hymnal.topics) return null;
        return {
            type: "topic",
            name: "Topical Index",
            entries: Object.values(hymnal.topics).map(topic => ({
                name: topic.name,
                id: topic.id,
                list: Object.values(hymnal.hymns)
                    .filter(hymn => hymn.topics.includes(topic.id))
                    .map(hymn => hymn.id),
            })),
        };
    },
    hymnal => {
        if (!hymnal.tunes) return null;
        return {
            type: "tune",
            name: "Index of Tunes",
            entries: Object.values(hymnal.tunes).map(tune => ({
                name: tune.name || tune.id,
                id: tune.id,
                list: Object.values(hymnal.hymns)
                    .filter(hymn => hymn.tunes.includes(tune.id))
                    .map(hymn => hymn.id),
            })),
        };
    },
    hymnal => {
        return {
            type: "origin",
            name: "Index of Origins",
            entries: [...new Set(Object.values(hymnal.hymns).map(hymn => hymn.origin))]
                .sort()
                .map(origin => ({
                    name: origin || "Unknown",
                    id: origin || "Unknown",
                    list: Object.values(hymnal.hymns)
                        .filter(hymn => hymn.origin === origin)
                        .map(hymn => hymn.id),
                })),
        };
    },
    hymnal => {
        return {
            type: "author",
            name: "Index of Authors",
            entries: [
                ...new Set(
                    Object.values(hymnal.hymns).flatMap(hymn =>
                        hymn.authors.map(author => author.name)
                    )
                ),
            ]
                .sort()
                .map(authorName => ({
                    name: authorName || "Unknown",
                    id: authorName || "Unknown",
                    list: Object.values(hymnal.hymns)
                        .filter(hymn =>
                            hymn.authors.map(author => author.name).includes(authorName)
                        )
                        .map(hymn => hymn.id),
                })),
        };
    },
    hymnal => {
        return {
            type: "translator",
            name: "Index of Translators",
            entries: [
                ...new Set(
                    Object.values(hymnal.hymns).flatMap(hymn =>
                        hymn.translators.map(translator => translator.name)
                    )
                ),
            ]
                .sort()
                .map(translatorName => ({
                    name: translatorName || "Unknown",
                    id: translatorName || "Unknown",
                    list: Object.values(hymnal.hymns)
                        .filter(hymn =>
                            hymn.translators
                                .map(translator => translator.name)
                                .includes(translatorName)
                        )
                        .map(hymn => hymn.id),
                })),
        };
    },
    hymnal => {
        let languages = Object.values(hymnal.languages);
        if (languages.length < 2) return null;
        return {
            type: "language",
            name: "Index of Languages",
            entries: Object.values(hymnal.languages).map(language => ({
                name: language.name,
                id: language.id,
                list: Object.values(hymnal.hymns)
                    .filter(hymn => hymn.language === language.id)
                    .map(hymn => hymn.id),
            })),
        };
    },
    hymnal => {
        if (!hymnal.calendar) return null;
        return {
            type: "day",
            name: "Liturgical Index",
            entries: Object.values(hymnal.calendar).map(day => ({
                name: day.name,
                id: day.id,
                list: Object.values(hymnal.hymns)
                    .filter(hymn => hymn.days.includes(day.id))
                    .map(hymn => hymn.id),
            })),
        };
    },
];
