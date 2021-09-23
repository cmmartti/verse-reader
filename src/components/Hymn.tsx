import React from "react";
import {Link} from "react-router-dom";

import {useDisplayOptions} from "../context/ContextDisplayOptions";
import {useDocumentLocation} from "../context/ContextDocumentLocation";

export const Hymn = React.memo(_Hymn);

type HymnProps = {
    node: Element;
};

export function _Hymn({node}: HymnProps) {
    const [{repeatRefrain, repeatChorus}] = useDisplayOptions();
    const {setPage} = useDocumentLocation();

    const id = node.getAttribute("id")!;
    const chorus = node.querySelector(":scope > verses > chorus");
    const refrain = node.querySelector(":scope > verses > refrain");
    const refrainLines = [
        ...node.querySelectorAll(
            ":scope > verses > refrain > line, :scope > verses > refrain > repeat"
        ),
    ];
    const verses = [...node.querySelectorAll(":scope > verses > verse")];

    const setCurrent = React.useCallback(() => setPage(id, false), [id, setPage]);

    return (
        <div className="hymn" id={id}>
            {!verses.length && (
                <a
                    className="hymn-number"
                    href={"#" + id}
                    onClick={e => {
                        e.preventDefault();
                        setCurrent();
                    }}
                >
                    {id}.
                </a>
            )}
            {verses.map((verse, i) => {
                const lines = [
                    ...verse.querySelectorAll(":scope > line, :scope > repeat"),
                ];

                return (
                    <React.Fragment key={i}>
                        {i === 0 ? (
                            <>
                                <p className="verse">
                                    <a
                                        className="hymn-number"
                                        id={id}
                                        href={"#" + id}
                                        onClick={e => {
                                            e.preventDefault();
                                            setCurrent();
                                        }}
                                    >
                                        {id}.
                                    </a>{" "}
                                    <Lines lines={lines} />
                                    {repeatRefrain && <Lines lines={refrainLines} />}
                                </p>

                                {chorus && <Chorus node={chorus} />}
                                {!repeatRefrain && refrain && <Refrain node={refrain} />}
                            </>
                        ) : (
                            <>
                                <p className="verse">
                                    <span className="verse-number">{i + 1}.</span>{" "}
                                    <Lines lines={lines} />
                                    {!repeatChorus && chorus && <i>Chorus:</i>}
                                    {refrain &&
                                        (repeatRefrain ? (
                                            <Lines lines={refrainLines} />
                                        ) : (
                                            <i>Refrain:</i>
                                        ))}
                                </p>

                                {repeatChorus && chorus && <Chorus node={chorus} />}
                            </>
                        )}
                    </React.Fragment>
                );
            })}
            <Details node={node} />
        </div>
    );
}

function Details({node}: {node: Element}) {
    const {getSearchURL} = useDocumentLocation();

    const number = node.getAttribute("id")!;

    const tunes = [...node.querySelectorAll(":scope > tune[ref]")].map(tuneRef =>
        node.ownerDocument.querySelector(
            `hymnal > tunes tune[id="${tuneRef.getAttribute("ref")!}"]`
        )
    );
    const topics = [...node.querySelectorAll(":scope > topic[ref]")].map(topicRef =>
        node.ownerDocument.querySelector(
            `hymnal > topics > topic[id="${topicRef.getAttribute("ref")!}"]`
        )
    );
    const author = node.querySelector(":scope > author");
    const translator = node.querySelector(":scope > translator");
    const days = [...node.querySelectorAll(":scope > day[ref]")].map(dayRef =>
        node.ownerDocument.querySelector(
            `hymnal > liturgical-calendar day[id="${dayRef.getAttribute("ref")!}"]`
        )
    );

    return (
        <div className="details">
            {tunes.length > 0 && (
                <div>
                    {tunes.length === 1 && "Tune: "}
                    {tunes.length > 1 && "Tunes: "}
                    {tunes.map(tune => {
                        const name = tune!.getAttribute("name");
                        const id = tune!.getAttribute("id");
                        return (
                            <React.Fragment key={id}>
                                <Link to={getSearchURL(`tune:${number}`)}>
                                    {name || id}
                                </Link>{" "}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
            {topics.length > 0 && (
                <div>
                    {topics.length === 1 && "Topic: "}
                    {topics.length > 1 && "Topics: "}
                    {topics.map(topic => {
                        const name = topic!.getAttribute("name");
                        const id = topic!.getAttribute("id");
                        return (
                            <React.Fragment key={id}>
                                <Link to={getSearchURL(`topic:${id}`)}>{name}</Link>{" "}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
            {days.length > 0 && (
                <div>
                    {days.length === 1 && "Day: "}
                    {days.length > 1 && "Days: "}
                    {days.map(day => {
                        if (!day) return null;
                        const name = day.getAttribute("name");
                        const id = day.getAttribute("id");
                        const isAlternate = day.getAttribute("alternate") ?? false;
                        return (
                            <React.Fragment key={id}>
                                <Link to={getSearchURL(`day:${id}`)}>
                                    {isAlternate && "("}
                                    {name || id}
                                    {isAlternate && ")"}
                                </Link>{" "}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
            {author && (
                <div>
                    Author: {author.textContent}
                    {author.getAttribute("year") && ` (${author.getAttribute("year")})`}
                    {author.getAttribute("country") &&
                        ` (${author.getAttribute("country")})`}
                </div>
            )}
            {translator && (
                <div>
                    Transl: {translator.textContent}
                    {translator.getAttribute("year") &&
                        ` (${translator.getAttribute("year")})`}
                </div>
            )}
        </div>
    );
}

const Chorus = React.memo(function Chorus({node}: {node: Element}) {
    const [{repeatChorus}] = useDisplayOptions();
    const lines = [...node.querySelectorAll(":scope > line, :scope > repeat")];
    return (
        <p className="chorus">
            {!repeatChorus && <i>Chorus:</i>} <Lines lines={lines} />
        </p>
    );
});

const Refrain = React.memo(function Refrain({node}: {node: Element}) {
    const lines = [...node.querySelectorAll(":scope > line, :scope > repeat")];
    return (
        <p className="refrain">
            <i>Refrain:</i> <Lines lines={lines} />
        </p>
    );
});

const Lines = React.memo(function Lines({lines}: {lines: Element[]}) {
    return (
        <React.Fragment>
            {lines.map((line, i) => {
                switch (line.localName) {
                    case "repeat":
                        return (
                            <React.Fragment key={i}>
                                {/* {" "} */}
                                <Repeat node={line} />
                            </React.Fragment>
                        );
                    case "line":
                        return <Line key={i} text={line.textContent!} />;
                    default:
                        return null;
                }
            })}
        </React.Fragment>
    );
});

const Repeat = React.memo(function Repeat({node}: {node: Element}) {
    const [{expandRepeatedLines}] = useDisplayOptions();
    const times = parseInt(node.getAttribute("times")!, 10);
    const lines = [...node.querySelectorAll(":scope > line")];

    if (expandRepeatedLines)
        return (
            <span>
                {[...Array(times)].map((_, i) => (
                    <Lines key={i} lines={lines} />
                ))}
            </span>
        );
    return (
        <span className="repeat">
            <Lines lines={lines} />
            &nbsp;
            <span className="repeat-marker">
                {/* {[...Array(times)].map(() => ":").join(",")} */}
                [x{times}]
            </span>
        </span>
    );
});

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

const Line = React.memo(function Line({text}: {text: string}) {
    const [{highlight}] = useDisplayOptions();

    let renderedText: React.ReactNode = text;
    if (highlight) {
        renderedText = replaceAll(text, new RegExp(highlight, "gi"), substr => (
            <span className="highlight">{substr}</span>
        ));
    }

    const EM_DASH = "—";
    const ZERO_WIDTH_SPACE = "\u200B";
    const noSpaceAfter = text.slice(-1) === EM_DASH;

    return (
        <>
            <span className={"line" + (noSpaceAfter ? " line--nospaceafter" : "")}>
                {renderedText}
            </span>
            {/* Allow for line-breaks after em dashes */}
            {noSpaceAfter ? ZERO_WIDTH_SPACE : " "}
        </>
    );
});
