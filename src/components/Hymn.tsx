import React from "react";
import {Link, useLocation} from "react-router-dom";
// import * as xpath from "fontoxpath";

import {useDisplayOptions} from "./ContextDisplayOptions";

const EM_DASH = "—";
const ZERO_WIDTH_SPACE = "\u200B";

// const getTunes = (hymn: Node) =>
//     xpath.evaluateXPathToStrings("tune/@ref", hymn).map(id => {
//         const name = xpath.evaluateXPathToString(
//             '/hymnal/tunes//tune[@id="$id"]/@name',
//             hymn,
//             null,
//             {id}
//         );
//         return {id, name: name || id};
//     });

export const Hymn = React.memo(_Hymn);

type HymnProps = {node: Element; isAboveTheFold?: boolean};

function _Hymn({node, isAboveTheFold = true}: HymnProps) {
    const location = useLocation();
    const fragment = location.hash.substring(1);
    const page = /[0-9]+/.test(fragment) ? fragment : null;

    const [{repeatChorus, repeatRefrain}] = useDisplayOptions();

    const [firstRender, setIsFirstRender] = React.useState(true);
    React.useEffect(() => {
        setIsFirstRender(false);
    }, []);

    const id = node.getAttribute("id")!;
    const isDeleted = node.getAttribute("deleted") === "true";
    const refrainLines = [...node.querySelectorAll("refrain > line, refrain > repeat")];
    const chorusLines = [...node.querySelectorAll("chorus > line, chorus > repeat")];
    const verses = [...node.querySelectorAll("verse")];

    const tunes = [...node.querySelectorAll("tune[ref]")!].map(
        tuneRef =>
            node.ownerDocument.querySelector(
                `hymnal > tunes tune[id="${tuneRef.getAttribute("ref")}"]`
            )!
    );
    let altTunes: Element[] = [];
    if (tunes[0].parentElement?.localName === "tunes-group")
        altTunes = [...tunes[0].parentElement.children].filter(t => t !== tunes[0]);

    const topics = [...node.querySelectorAll("topic[ref]")!].map(
        topicRef =>
            node.ownerDocument.querySelector(
                `hymnal > topics > topic[id="${topicRef.getAttribute("ref")}"]`
            )!
    );
    const origin = node.querySelector("origin")?.textContent ?? null;
    const authors = [...node.querySelectorAll("author")];
    const translators = [...node.querySelectorAll("translator")];
    const days = [...node.querySelectorAll("day[ref]")!].map(
        dayRef =>
            node.ownerDocument.querySelector(
                `hymnal > calendar > day[id="${dayRef.getAttribute("ref")}"]`
            )!
    );
    const links = [...node.querySelectorAll("link")].map(link => ({
        book: link.getAttribute("book"),
        edition: link.getAttribute("edition"),
        id: link.getAttribute("id"),
    }));

    if (firstRender && !isAboveTheFold) {
        return (
            <div className="Hymn">
                <div className="Hymn-number">{id}</div>
            </div>
        );
    }

    return (
        <article className={"Hymn" + (isDeleted ? " isDeleted" : "")}>
            <header className="Hymn-header">
                <div className="Hymn-number">{id}</div>
                {tunes.length > 0 && (
                    <div className="Hymn-tunes">
                        Tune:{" "}
                        {tunes.map((tune, index) => {
                            const tuneId = tune.getAttribute("id");
                            return (
                                <React.Fragment key={tuneId}>
                                    <Link key={tuneId} to={`?q=tune:${id}#${page}`}>
                                        {tune.getAttribute("name") || tuneId}
                                    </Link>
                                    {index < tunes.length - 1 && ", "}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
            </header>
            <div className="Hymn-verses">
                {verses.map((verse, i) => {
                    const verseLines = [
                        ...verse.querySelectorAll(":scope > line, :scope > repeat"),
                    ];

                    return (
                        <React.Fragment key={i}>
                            <p className="Hymn-verse">
                                <span className="Hymn-verseNumber">{i + 1}.</span>{" "}
                                <Lines lines={verseLines} />
                                {refrainLines.length > 0 &&
                                    (repeatRefrain ? (
                                        <span className="Hymn-inlineRefrain">
                                            <Lines lines={refrainLines} />
                                        </span>
                                    ) : (
                                        i > 0 && <i>Refrain:</i>
                                    ))}
                                {i > 0 && chorusLines.length > 0 && !repeatChorus && (
                                    <i>Chorus:</i>
                                )}
                            </p>

                            {refrainLines.length > 0 && !repeatRefrain && i === 0 && (
                                <p className="Hymn-refrain">
                                    <i>Refrain:</i> <Lines lines={refrainLines} />
                                </p>
                            )}

                            {chorusLines.length > 0 && !repeatChorus && i === 0 && (
                                <p className="Hymn-chorus">
                                    <i>Chorus:</i> <Lines lines={chorusLines} />
                                </p>
                            )}

                            {chorusLines.length > 0 && repeatChorus && (
                                <p className="Hymn-chorus">
                                    <Lines lines={chorusLines} />
                                </p>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <div className="Hymn-details">
                {topics.length > 0 && (
                    <div className="Hymn-topics">
                        {topics.length === 1 ? "Topic: " : "Topics: "}
                        {topics.map((topic, index) => {
                            const topicId = topic.getAttribute("id");
                            return (
                                <React.Fragment key={topicId}>
                                    <Link to={`?q=topic:${topicId}#${page}`}>
                                        {topic.getAttribute("name")}
                                    </Link>
                                    {index < topics.length - 1 && ", "}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
                {authors.length > 0 && (
                    <div>
                        {authors.length === 1 ? "Author: " : "Authors: "}
                        {authors
                            .map(
                                author =>
                                    author.textContent +
                                    (author.getAttribute("year")
                                        ? ` (${author.getAttribute("year")})`
                                        : "")
                            )
                            .join(", ")}
                        {origin && ` [${origin}]`}
                    </div>
                )}
                {translators.length > 0 && (
                    <div>
                        {translators.length === 1 ? "Translator: " : "Translators: "}
                        {translators
                            .map(
                                translator =>
                                    translator.textContent +
                                    (translator.getAttribute("year")
                                        ? ` (${translator.getAttribute("year")})`
                                        : "")
                            )
                            .join(", ")}
                    </div>
                )}
                {links.length > 0 && (
                    <div>
                        {links
                            .map(link => `${link.book}-${link.edition} #${link.id}`)
                            .join(" / ")}
                    </div>
                )}
                {days.length > 0 && (
                    <div className="Hymn-days">
                        {days.length === 1 ? "Day: " : "Days: "}
                        {days.map((day, index) => {
                            const name = day.getAttribute("shortName");
                            const dayId = day.getAttribute("id");
                            return (
                                <React.Fragment key={dayId}>
                                    <Link to={`?q=day:${dayId}#${page}`}>{name}</Link>
                                    {index < days.length - 1 && ", "}
                                </React.Fragment>
                            );
                        })}
                    </div>
                )}
                {altTunes.length > 0 && (
                    <div>
                        {altTunes.length === 1 ? "Alternate tune:" : "Alternate tunes:"}
                        <ul>
                            {altTunes.map(tune => {
                                const tuneId = tune.getAttribute("id");
                                return (
                                    <li key={tuneId}>
                                        <Link to={`?q=tune:${id}#${page}`}>
                                            {tune.getAttribute("name") || tuneId}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </article>
    );
}

function Lines({lines}: {lines: Element[]}) {
    const [{highlight, expandRepeatedLines}] = useDisplayOptions();

    return (
        <React.Fragment>
            {lines.map((line, i) => {
                switch (line.localName) {
                    case "repeat": {
                        const times = parseInt(line.getAttribute("times") || "2", 10);
                        const lines = [...line.querySelectorAll(":scope > line")];
                        if (expandRepeatedLines) {
                            return (
                                <span>
                                    {[...Array(times)].map((_, i) => (
                                        <Lines key={i} lines={lines} />
                                    ))}
                                </span>
                            );
                        }
                        return (
                            <span key={i} className="Hymn-repeat">
                                <Lines lines={lines} />
                                <span className="Hymn-repeatMarker">
                                    {/* {[...Array(times)].map(() => ":").join(",")} */}
                                    (x{times}){" "}
                                </span>
                            </span>
                        );
                    }

                    case "line": {
                        let renderedText: React.ReactNode = line.textContent;
                        if (highlight) {
                            renderedText = replaceAll(
                                line.textContent ?? "",
                                new RegExp(highlight, "gi"),
                                substr => <span className="highlight">{substr}</span>
                            );
                        }
                        const noSpaceAfter = line.textContent!.slice(-1) === EM_DASH;
                        return (
                            <React.Fragment key={i}>
                                <span
                                    className={
                                        "Hymn-line" +
                                        (noSpaceAfter ? " Hymn-line--nospaceafter" : "")
                                    }
                                >
                                    {renderedText}
                                </span>
                                {/* Allow for line-breaks after em dashes */}
                                {noSpaceAfter ? ZERO_WIDTH_SPACE : " "}
                            </React.Fragment>
                        );
                    }

                    default:
                        return null;
                }
            })}
        </React.Fragment>
    );
}

function replaceAll(
    text: string,
    regex: RegExp,
    replaceWith: (substr: string) => React.ReactNode
) {
    const matches = [...text.matchAll(regex)];
    if (matches.length === 0) return text;
    return matches.map((match, i) => (
        <React.Fragment key={i.toString()}>
            {i === 0 && text.substring(0, match.index!)}
            {replaceWith(match[0])}
            {i === matches.length - 1
                ? text.substring(match.index! + match[0].length)
                : text.substring(match.index! + match[0].length, matches[i + 1].index)}
        </React.Fragment>
    ));
}
