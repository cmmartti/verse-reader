import React from "react";
import {Link, useLocation} from "react-router-dom";
import {useDisplayOptions} from "./ContextDisplayOptions";

const EM_DASH = "—";
const ZERO_WIDTH_SPACE = "\u200B";

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
    // const title = node.querySelector("title")!.textContent;

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
    const authors = [...node.querySelectorAll("author")];
    const translators = [...node.querySelectorAll("translator")];
    const days = [...node.querySelectorAll("day[ref]")!].map(
        dayRef =>
            node.ownerDocument.querySelector(
                `hymnal > calendar > day[id="${dayRef.getAttribute("ref")}"]`
            )!
    );

    if (firstRender && !isAboveTheFold) {
        return (
            <div className="Hymn">
                <div className="Hymn-number">{id}</div>
            </div>
        );
    }

    return (
        <div className="Hymn" id={id}>
            <header className="Hymn-header">
                <div className="Hymn-number" id={id}>
                    {id}.
                </div>
                {tunes.length > 0 && (
                    <div className="Hymn-tunes">
                        Tune:{" "}
                        {tunes.map(tune => {
                            const tuneId = tune.getAttribute("id");
                            return (
                                <Link key={tuneId} to={`?q=tune:${id}#${page}`}>
                                    {tune.getAttribute("name") || tuneId}
                                </Link>
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
                                        <Lines lines={refrainLines} />
                                    ) : (
                                        i !== 0 && <i>Refrain:</i>
                                    ))}
                                {chorusLines.length > 0 && !repeatChorus && (
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
                        {topics.map(topic => {
                            const topicId = topic.getAttribute("id");
                            return (
                                <Link key={topicId} to={`?q=topic:${topicId}#${page}`}>
                                    {topic.getAttribute("name")}
                                </Link>
                            );
                        })}
                    </div>
                )}
                {days.length > 0 && (
                    <div className="Hymn-days">
                        {days.length === 1 ? "Day: " : "Days: "}
                        {days.map(day => {
                            const name = day.getAttribute("shortName");
                            const dayId = day.getAttribute("id");
                            return (
                                <Link key={dayId} to={`?q=day:${dayId}#${page}`}>
                                    {name}
                                </Link>
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
                {authors.length > 0 &&
                    authors.map(author => (
                        <div>
                            Author: {author.textContent}
                            {author.getAttribute("year") &&
                                ` (${author.getAttribute("year")})`}
                            {author.getAttribute("country") &&
                                ` (${author.getAttribute("country")})`}
                        </div>
                    ))}
                {translators.length > 0 &&
                    translators.map(translator => (
                        <div>
                            Transl: {translator.textContent}
                            {translator.getAttribute("year") &&
                                ` (${translator.getAttribute("year")})`}
                        </div>
                    ))}
            </div>
        </div>
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
                                &nbsp;
                                <span className="Hymn-repeatMarker">
                                    {/* {[...Array(times)].map(() => ":").join(",")} */}
                                    (x{times})
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
