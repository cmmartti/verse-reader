import React from "react";

import * as types from "../types";
import { navigate } from "../locationState";
import { Verses } from "./Verses";

export let Hymn = React.memo(_Hymn);

export function _Hymn({ hymn, book }: { hymn: types.Hymn; book: types.Hymnal }) {
    let contributors = hymn.contributors.map(({ type, id, year, note }) => {
        return {
            type,
            id,
            name: (id ? book.contributors?.[id]?.name : null) ?? id,
            year,
            note,
        };
    });

    let authors = contributors.filter(c => c.type === "author");
    let translators = contributors.filter(c => c.type === "translator");

    return (
        <article
            className={"Hymn" + (hymn.isDeleted ? " isDeleted" : "")}
            lang={hymn.language}
        >
            <header className="Hymn-header">
                <h2 className="Hymn-title">
                    <span role="presentation">
                        {hymn.isRestricted && <span className="Hymn-asterisk">*</span>}
                        {hymn.id}.{" "}
                        {hymn.isDeleted && (
                            <span className="visually-hidden">deleted </span>
                        )}
                    </span>
                    <span role="presentation">{hymn.title}</span>
                </h2>

                {hymn.topics.length > 0 && (
                    <p className="Hymn-topics">
                        <span className="visually-hidden" role="presentation">
                            Topic{hymn.topics.length !== 1 && "s"}:{" "}
                        </span>
                        {hymn.topics
                            .map(
                                topicId =>
                                    book.topics?.[topicId] ?? {
                                        id: topicId,
                                        name: topicId,
                                    }
                            )
                            .map((topic, index) => (
                                <React.Fragment key={topic.id}>
                                    <span role="presentation" className="Hymn-topic">
                                        {topic.name}
                                    </span>
                                    {index < hymn.topics.length - 1 && ", "}
                                </React.Fragment>
                            ))}
                    </p>
                )}
            </header>

            {hymn.tunes.length > 0 && (
                <div className="Hymn-tunes">
                    Tune:{" "}
                    {hymn.tunes
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
                                    {index < hymn.tunes.length - 1 && ", "}
                                </React.Fragment>
                            );
                        })}
                </div>
            )}

            <Verses hymn={hymn} />

            <footer className="Hymn-details">
                {hymn.language !== book.language && (
                    <p>
                        Language: {book.languages[hymn.language]?.name ?? hymn.language}
                    </p>
                )}
                {authors.length > 0 && (
                    <p>
                        {authors.length === 1 ? "Author: " : "Authors: "}
                        {authors
                            .map(
                                ({ name, note, year }) =>
                                    name +
                                    (note ? ` (${note})` : "") +
                                    (year ? ` (${year})` : "")
                            )
                            .join(", ")}
                    </p>
                )}

                {hymn.origin && (
                    <p>Origin: {book.origins?.[hymn.origin]?.name ?? hymn.origin}</p>
                )}

                {translators.length > 0 && (
                    <p>
                        {translators.length === 1 ? "Translator: " : "Translators: "}
                        {translators
                            .map(
                                ({ name, note, year }) =>
                                    name +
                                    (note ? ` (${note})` : "") +
                                    (year ? ` (${year})` : "")
                            )
                            .join(", ")}
                    </p>
                )}
                {hymn.links.length > 0 && (
                    <p>
                        {hymn.links.map(link => (
                            <span key={link.edition}>
                                <a
                                    href={`/en-${link.edition}?loc=${link.id}`}
                                    onClick={event => {
                                        event.preventDefault();
                                        navigate(
                                            prevState => ({
                                                ...prevState,
                                                book: "en-" + link.edition,
                                                [`book/en-${link.edition}/loc`]: link.id,
                                            }),
                                            false
                                        );
                                    }}
                                >
                                    {link.edition}#{link.id}
                                </a>
                                {", "}
                            </span>
                        ))}
                    </p>
                )}
                {/* {hymn.days.length > 0 && (
                    <p className="Hymn-days">
                        {hymn.days.length === 1 ? "Day: " : "Days: "}
                        {hymn.days
                            .map(dayId => book.calendar[dayId])
                            .map((day, index) => (
                                <React.Fragment key={day.id}>
                                    {day.name}
                                    {index < hymn.days.length - 1 && ", "}
                                </React.Fragment>
                            ))}
                    </p>
                )} */}
                {hymn.isRestricted && (
                    <p>*Not for church services; may be used for other occasions.</p>
                )}
                {hymn.isDeleted && <p>Deleted</p>}
            </footer>
        </article>
    );
}
