import React from "react";
import {Link, useLocation} from "react-router-dom";
import {useDisplayOptions} from "../context/ContextDisplayOptions";

export const Hymn = React.memo(_Hymn);

type HymnProps = {node: Element; isAboveTheFold?: boolean};

function _Hymn({node, isAboveTheFold = true}: HymnProps) {
    const [firstRender, setIsFirstRender] = React.useState(true);
    React.useEffect(() => {
        setIsFirstRender(false);
    }, []);

    const id = node.getAttribute("id")!;

    const refrainLines = [
        ...node.querySelectorAll(
            ":scope > verses > refrain > line, :scope > verses > refrain > repeat"
        ),
    ];
    const chorusLines = [
        ...node.querySelectorAll(
            ":scope > verses > chorus > line, :scope > verses > chorus > repeat"
        ),
    ];
    const verses = [...node.querySelectorAll(":scope > verses > verse")];

    if (firstRender && !isAboveTheFold) {
        return (
            <div className="hymn">
                <div className="hymn-number">{id}</div>
            </div>
        );
    }

    return (
        <div className="Hymn" id={id}>
            {verses.map((verse, i) => {
                const lines = [
                    ...verse.querySelectorAll(":scope > line, :scope > repeat"),
                ];

                return (
                    <React.Fragment key={i}>
                        {i === 0 ? (
                            <>
                                <p>
                                    <a className="Hymn-number" id={id} href={"#" + id}>
                                        {id}.
                                    </a>{" "}
                                    <Lines lines={lines} />
                                </p>

                                {refrainLines.length > 0 && (
                                    <p className="Hymn-refrain">
                                        <i>Refrain:</i> <Lines lines={refrainLines} />
                                    </p>
                                )}
                                {chorusLines.length > 0 && (
                                    <p className="Hymn-chorus">
                                        <i>Chorus:</i> <Lines lines={chorusLines} />
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="Hymn-verse">
                                <span className="Hymn-verseNumber">{i + 1}.</span>{" "}
                                <Lines lines={lines} />
                            </p>
                        )}
                    </React.Fragment>
                );
            })}
            <Details node={node} />
        </div>
    );
}

function Details({node}: {node: Element}) {
    const location = useLocation();
    const fragment = location.hash.substring(1);
    const page = /[0-9]+/.test(fragment) ? fragment : null;

    const id = node.getAttribute("id")!;
    const tunes = [...node.querySelectorAll(":scope > tune[ref]")!].map(
        tuneRef =>
            node.ownerDocument.querySelector(
                `hymnal > tunes tune[id="${tuneRef.getAttribute("ref")}"]`
            )!
    );
    const topics = [...node.querySelectorAll(":scope > topic[ref]")!].map(
        topicRef =>
            node.ownerDocument.querySelector(
                `hymnal > topics > topic[id="${topicRef.getAttribute("ref")}"]`
            )!
    );
    const author = node.querySelector(":scope > author");
    const translator = node.querySelector(":scope > translator");
    const days = [...node.querySelectorAll(":scope > day[ref]")!].map(
        dayRef =>
            node.ownerDocument.querySelector(
                `hymnal > liturgical-calendar day[id="${dayRef.getAttribute("ref")}"]`
            )!
    );

    return (
        <div className="Hymn-details">
            {tunes.length > 0 && (
                <div>
                    {tunes.length === 1 && "Tune: "}
                    {tunes.length > 1 && "Tunes: "}
                    {tunes.map(tune => {
                        const name = tune.getAttribute("name");
                        const tuneId = tune.getAttribute("id");
                        return (
                            <React.Fragment key={tuneId}>
                                <Link to={`?q=tune:${id}#${page}`}>
                                    {name || tuneId}
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
                        const name = topic.getAttribute("name");
                        const topicId = topic.getAttribute("id");
                        return (
                            <React.Fragment key={topicId}>
                                <Link to={`?q=topic:${topicId}#${page}`}>{name}</Link>{" "}
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
            {days.length > 0 && (
                <div>
                    {days.length === 1 && "Day: "}
                    {days.length > 1 && "Days: "}
                    <ul>
                        {days.map(day => {
                            const name = day.getAttribute("name");
                            const dayId = day.getAttribute("id");
                            return (
                                <li key={dayId}>
                                    <Link to={`?q=day:${dayId}#${page}`}>{name}</Link>{" "}
                                </li>
                            );
                        })}
                    </ul>
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

function Lines({lines}: {lines: Element[]}) {
    const [{highlight}] = useDisplayOptions();

    return (
        <React.Fragment>
            {lines.map((line, i) => {
                switch (line.localName) {
                    case "repeat":
                        return <Repeat key={i} node={line} />;
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
                        // return <Line key={i} text={line.textContent!} />;
                    }
                    default:
                        return null;
                }
            })}
        </React.Fragment>
    );
}

function Repeat({node}: {node: Element}) {
    const times = parseInt(node.getAttribute("times")!, 10);
    const lines = [...node.querySelectorAll(":scope > line")];

    return (
        <span className="Hymn-repeat">
            <Lines lines={lines} />
            &nbsp;
            <span className="Hymn-repeatMarker">
                {/* {[...Array(times)].map(() => ":").join(",")} */}
                [x{times}]
            </span>
        </span>
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

const EM_DASH = "—";
const ZERO_WIDTH_SPACE = "\u200B";
