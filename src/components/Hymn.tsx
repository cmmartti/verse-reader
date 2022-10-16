import React from "react";

import * as types from "../types";
import { Verses } from "./Verses";
import { Link } from "react-router-dom";

export let Hymn = React.memo(_Hymn);

function _Hymn({ hymn, book }: { hymn: types.Hymn; book: types.Hymnal }) {
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

    function getURL(search: string) {
        return `index?q=${encodeURIComponent(search)}`;
    }

    return (
        <article
            className={"Hymn" + (hymn.isDeleted ? " isDeleted" : "")}
            lang={hymn.language}
        >
            <header className="Hymn-header">
                <h2 className="Hymn-title">
                    <span role="presentation" style={{ whiteSpace: "nowrap" }}>
                        {hymn.id}.{" "}
                        {hymn.isRestricted && <span className="Hymn-asterisk">*</span>}
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
                                    <Link
                                        className="Hymn-topic"
                                        to={getURL(`#topic=${topic.id}`)}
                                    >
                                        {topic.name}
                                    </Link>
                                    {index < hymn.topics.length - 1 && ", "}
                                </React.Fragment>
                            ))}
                    </p>
                )}
            </header>

            {/* {hymn.tunes.length > 0 && (
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
                                    <Link>{tune.name || tune.id}</Link>
                                    {index < hymn.tunes.length - 1 && ", "}
                                </React.Fragment>
                            );
                        })}
                </div>
            )} */}

            <Verses hymn={hymn} />

            <footer className="Hymn-footer">
                {hymn.language !== book.language && (
                    <span className="Hymn-link">
                        <h3>Language</h3>
                        <Link to={getURL(`#language=${hymn.language}`)}>
                            {book.languages[hymn.language]?.name ?? hymn.language}
                        </Link>
                    </span>
                )}

                {hymn.tunes.length > 0 && (
                    <span className="Hymn-link">
                        <h3>Tune{hymn.tunes.length > 1 && "s"}</h3>
                        {hymn.tunes.map(id => (
                            <Link key={id} to={getURL(`#tune=${id}`)}>
                                {book.tunes?.[id]?.name ?? id}
                            </Link>
                        ))}
                    </span>
                )}

                <span className="Hymn-link">
                    <h3>Author{authors.length > 1 && "s"}</h3>
                    {authors.map(({ name, note, year, id }, i) => (
                        <div key={i}>
                            <Link to={getURL(`#author=${id}`)}>{name}</Link>
                            {note && ` (${note})`}
                            {year && ` (${year})`}
                        </div>
                    ))}
                    {authors.length === 0 && "—"}
                </span>

                <span className="Hymn-link">
                    <h3>Origin</h3>
                    {hymn.origin ? (
                        <Link to={getURL(`#origin=${hymn.origin}`)}>
                            {book.origins?.[hymn.origin]?.name ?? hymn.origin}
                        </Link>
                    ) : (
                        "—"
                    )}
                </span>

                {translators.length > 0 && (
                    <span className="Hymn-link">
                        <h3>Translator{translators.length > 1 && "s"}</h3>
                        {translators.map(({ name, note, year, id }, i) => (
                            <div key={i}>
                                <Link to={getURL(`#transl=${id}`)}>{name}</Link>
                                {note && ` (${note})`}
                                {year && ` (${year})`}
                            </div>
                        ))}
                    </span>
                )}

                {hymn.links.length > 0 && (
                    <span className="Hymn-link">
                        <h3>Elsewhere</h3>
                        {hymn.links.map(link => (
                            <Link
                                key={link.edition}
                                to={`/en-${link.edition}?loc=${link.id}`}
                            >
                                EN-{link.edition} → {link.id}
                            </Link>
                        ))}
                    </span>
                )}

                {hymn.days.length > 0 && (
                    <span className="Hymn-link">
                        <h3>Suggested Use</h3>
                        {hymn.days.map(id => (
                            <Link key={id} to={getURL(`#day=${id}`)}>
                                {book.days?.[id]?.name ?? id}
                            </Link>
                        ))}
                    </span>
                )}

                {hymn.isRestricted && (
                    <span className="Hymn-link">
                        <h3>Note</h3>
                        <span>
                            *
                            <Link to={getURL("#restricted")}>
                                Not for church services
                            </Link>
                            ; may be used for other occasions.
                        </span>
                    </span>
                )}

                {hymn.isDeleted && (
                    <span className="Hymn-link">
                        <h3>Note</h3>
                        <span>
                            This hymn was <Link to={getURL("#deleted")}>deleted</Link> in
                            a later printing
                        </span>
                    </span>
                )}
            </footer>
        </article>
    );
}
