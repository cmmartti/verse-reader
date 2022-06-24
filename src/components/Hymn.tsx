import React from "react";

import * as types from "../types";
import c from "../util/c";
import { setStateAndNavigate, useAppState } from "../state";

export let Hymn = React.memo(_Hymn);

export function _Hymn({ hymn, book }: { hymn: types.Hymn; book: types.Hymnal }) {
    let authors = hymn.contributors.filter(contributor => contributor.type === "author");
    let translators = hymn.contributors.filter(
        contributor => contributor.type === "translator"
    );

    return (
        <article className={"Hymn" + (hymn.isDeleted ? " isDeleted" : "")}>
            <header className="Hymn-header">
                <h2 className="Hymn-number">
                    <span className="visually-hidden" role="presentation">
                        Page{" "}
                    </span>
                    {hymn.isDeleted && <span className="visually-hidden">deleted</span>}
                    {hymn.isRestricted && <span className="Hymn-asterisk">*</span>}
                    {hymn.id}
                    <span className="visually-hidden" role="presentation">
                        . {hymn.title}
                    </span>
                </h2>
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
                                    <span role="presentation">{topic.name}</span>
                                    {index < hymn.topics.length - 1 && ", "}
                                </React.Fragment>
                            ))}
                    </p>
                )}
            </header>

            <div className="Hymn-verses" lang={hymn.language}>
                {hymn.verses.map((verse, i) => (
                    <Verse verse={verse} verseNumber={i + 1} hymn={hymn} key={i} />
                ))}
            </div>

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
                                ({ id, note, year }) =>
                                    id +
                                    (note ? ` (${note})` : "") +
                                    (year ? ` (${year})` : "")
                            )
                            .join(", ")}
                        {hymn.origin && ` [${hymn.origin}]`}
                    </p>
                )}
                {translators.length > 0 && (
                    <p>
                        {translators.length === 1 ? "Translator: " : "Translators: "}
                        {translators
                            .map(
                                ({ id, note, year }) =>
                                    id +
                                    (note ? ` (${note})` : "") +
                                    (year ? ` (${year})` : "")
                            )
                            .join(", ")}
                        {hymn.origin && ` [${hymn.origin}]`}
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
                                        setStateAndNavigate(
                                            prevState => ({
                                                ...prevState,
                                                "app/currentBook": "en-" + link.edition,
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
            </footer>
        </article>
    );
}

function Verse({
    verse,
    verseNumber,
    hymn,
}: {
    verse: types.Verse;
    verseNumber: number;
    hymn: types.Hymn;
}) {
    let [repeatRefrain] = useAppState("hymn/repeatRefrain", true);
    let [repeatChorus] = useAppState("hymn/repeatChorus", false);

    return (
        <React.Fragment>
            <p className={"Hymn-verse" + c("is-deleted", verse.isDeleted)}>
                <span className="Hymn-verseNumber">
                    <span className="visually-hidden" role="presentation">
                        Verse{" "}
                    </span>
                    {verseNumber}
                    {verse.isDeleted && (
                        <span className="visually-hidden" role="presentation">
                            , deleted{" "}
                        </span>
                    )}
                    .
                </span>{" "}
                <Lines lines={verse.lines} />
                {hymn.refrain &&
                    (repeatRefrain ? (
                        <span
                            className={
                                "Hymn-inlineRefrain" +
                                c("is-deleted", hymn.refrain.isDeleted)
                            }
                        >
                            <span className="visually-hidden">
                                Refrain
                                {hymn.refrain.isDeleted && ", deleted"}:{" "}
                            </span>
                            <Lines lines={hymn.refrain.lines} />
                        </span>
                    ) : (
                        verseNumber > 1 && (
                            <em>
                                <span aria-hidden>Refrain:</span>
                                <span className="visually-hidden" role="presentation">
                                    Refrain repeats here.
                                </span>
                            </em>
                        )
                    ))}
                {verseNumber > 1 && hymn.chorus && !repeatChorus && (
                    <em>
                        <span aria-hidden>Chorus:</span>
                        <span className="visually-hidden" role="presentation">
                            Chorus repeats here.
                        </span>
                    </em>
                )}
            </p>

            {hymn.refrain && !repeatRefrain && verseNumber === 1 && (
                <p className={"Hymn-refrain" + c("is-deleted", hymn.refrain.isDeleted)}>
                    <em>
                        Refrain
                        {hymn.refrain.isDeleted && (
                            <span className="visually-hidden" role="presentation">
                                , deleted
                            </span>
                        )}
                        :
                    </em>{" "}
                    <Lines lines={hymn.refrain.lines} />
                </p>
            )}

            {hymn.chorus && !repeatChorus && verseNumber === 1 && (
                <p className={"Hymn-chorus" + c("is-deleted", hymn.chorus.isDeleted)}>
                    <em>
                        Chorus
                        {hymn.chorus.isDeleted && (
                            <span className="visually-hidden" role="presentation">
                                , deleted
                            </span>
                        )}
                        :
                    </em>{" "}
                    <Lines lines={hymn.chorus.lines} />
                </p>
            )}

            {hymn.chorus && repeatChorus && (
                <p className={"Hymn-chorus" + c("is-deleted", hymn.chorus.isDeleted)}>
                    <span className="visually-hidden">
                        Chorus
                        {hymn.chorus.isDeleted && ", deleted"}:{" "}
                    </span>
                    <Lines lines={hymn.chorus.lines} />
                </p>
            )}
        </React.Fragment>
    );
}

function Lines({ lines }: { lines: (types.Line | types.RepeatLines)[] }) {
    return (
        <React.Fragment>
            {lines.map((lineOrRepeat, i) => {
                switch (lineOrRepeat.kind) {
                    case "repeat":
                        return <RepeatLines key={i} repeat={lineOrRepeat} />;
                    case "line":
                        return <Line key={i} line={lineOrRepeat} />;
                    default:
                        return null;
                }
            })}
        </React.Fragment>
    );
}

function RepeatLines({ repeat }: { repeat: types.RepeatLines }) {
    let [expandRepeatedLines] = useAppState("hymn/expandRepeatedLines", false);

    if (expandRepeatedLines) {
        return (
            <span>
                {[...Array(repeat.times)].map((_, i) => (
                    <Lines key={i} lines={repeat.lines} />
                ))}
            </span>
        );
    }
    return (
        <span className="Hymn-repeat">
            <Lines lines={repeat.lines} />
            <span className="Hymn-repeatMarker">
                {[...Array(repeat.times)].map(() => ":").join(",")}
                {/* ({repeat.times}x){" "} */}
            </span>
        </span>
    );
}

const EM_DASH = "—";
const ZERO_WIDTH_SPACE = "\u200B";

function Line({ line }: { line: types.Line }) {
    let noSpaceAfter = line.text.slice(-1) === EM_DASH;
    return (
        <React.Fragment>
            <span className={"Hymn-line" + c("Hymn-line--nospaceafter", noSpaceAfter)}>
                {line.text}
            </span>
            {/* Allow for line-breaks after em dashes */}
            {noSpaceAfter ? ZERO_WIDTH_SPACE : " "}
        </React.Fragment>
    );
}
