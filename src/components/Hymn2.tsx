import React from "react";
import {Link, useLocation} from "react-router-dom";
import {HymnValue, Verse} from "../HymnalDocument";
import {useDisplayOptions} from "./ContextDisplayOptions";

const EM_DASH = "—";
const ZERO_WIDTH_SPACE = "\u200B";

export const Hymn = React.memo(_Hymn);

type HymnProps = {hymn: HymnValue; isAboveTheFold?: boolean};

function _Hymn({hymn, isAboveTheFold = true}: HymnProps) {
    const location = useLocation();
    const fragment = location.hash.substring(1);
    const page = /[0-9]+/.test(fragment) ? fragment : null;

    const [{repeatChorus, repeatRefrain}] = useDisplayOptions();

    const [firstRender, setIsFirstRender] = React.useState(true);
    React.useEffect(() => {
        setIsFirstRender(false);
    }, []);

    if (firstRender && !isAboveTheFold) {
        return (
            <div className="Hymn">
                <div className="Hymn-number">{hymn.id}</div>
            </div>
        );
    }

    return (
        <article className="Hymn" id={hymn.id}>
            <header className="Hymn-header">
                <div className="Hymn-number" id={hymn.id}>
                    {hymn.id}.
                </div>
                {hymn.tunes.length > 0 && (
                    <div className="Hymn-tunes">
                        Tune:{" "}
                        {hymn.tunes.map(tune => (
                            <Link key={tune.id} to={`?q=tune:${hymn.id}#${page}`}>
                                {tune.name}
                            </Link>
                        ))}
                    </div>
                )}
            </header>
            <div className="Hymn-verses">
                {hymn.verses.map((verse, i) => {
                    return (
                        <React.Fragment key={i}>
                            <p className="Hymn-verse">
                                <span className="Hymn-verseNumber">{i + 1}.</span>{" "}
                                <Lines verse={verse} />
                                {hymn.refrain &&
                                    (repeatRefrain ? (
                                        <Lines verse={hymn.refrain} />
                                    ) : (
                                        i !== 0 && <i>Refrain:</i>
                                    ))}
                                {hymn.chorus && !repeatChorus && <i>Chorus:</i>}
                            </p>
                            {hymn.refrain && !repeatRefrain && i === 0 && (
                                <p className="Hymn-refrain">
                                    <i>Refrain:</i> <Lines verse={hymn.refrain} />
                                </p>
                            )}
                            {hymn.chorus && !repeatChorus && i === 0 && (
                                <p className="Hymn-chorus">
                                    <i>Chorus:</i> <Lines verse={hymn.chorus} />
                                </p>
                            )}
                            {hymn.chorus && repeatChorus && (
                                <p className="Hymn-chorus">
                                    <Lines verse={hymn.chorus} />
                                </p>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            <div className="Hymn-details">
                {hymn.topics.length > 0 && (
                    <div className="Hymn-topics">
                        {hymn.topics.length === 1 ? "Topic: " : "Topics: "}
                        {hymn.topics.map(topic => (
                            <Link key={topic.id} to={`?q=topic:${topic.id}#${page}`}>
                                {topic.name}
                            </Link>
                        ))}
                    </div>
                )}
                {hymn.authors.length > 0 &&
                    hymn.authors.map(author => (
                        <div key={author.name}>
                            Author: {author.name}
                            {author.year && ` (${author.year})`}
                            {author.country && ` (${author.country})`}
                        </div>
                    ))}
                {hymn.translators.length > 0 &&
                    hymn.translators.map(translator => (
                        <div key={translator.name}>
                            Transl: {translator.name}
                            {translator.year && ` (${translator.year})`}
                        </div>
                    ))}
                {hymn.days.length > 0 && (
                    <div className="Hymn-days">
                        {hymn.days.length === 1 ? "Day: " : "Days: "}
                        {hymn.days.map(day => (
                            <Link key={day.id} to={`?q=day:${day.id}#${page}`}>
                                {day.shortName}
                            </Link>
                        ))}
                    </div>
                )}
                {hymn.altTunes.length > 0 && (
                    <div>
                        {hymn.altTunes.length === 1
                            ? "Alternate tune:"
                            : "Alternate tunes:"}
                        <ul>
                            {hymn.altTunes.map(tune => (
                                <li key={tune.id}>
                                    <Link to={`?q=tune:${hymn.id}#${page}`}>
                                        {tune.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </article>
    );
}

function copy<T>(n: number, fn: (i: number) => T) {
    return [...Array(n)].map((_, index) => fn(index));
}

function Lines({verse}: {verse: Verse}) {
    const [{expandRepeatedLines}] = useDisplayOptions();

    return (
        <>
            {verse.map(({lines, times}, i) => {
                if (times === 1 || expandRepeatedLines) {
                    return (
                        <React.Fragment key={i}>
                            {lines.map(line =>
                                copy(times, j => <Line key={j} line={line} />)
                            )}
                        </React.Fragment>
                    );
                }
                return (
                    <span key={i} className="Hymn-repeat">
                        {lines.map(line =>
                            copy(times, j => <Line key={j} line={line} />)
                        )}{" "}
                        <span className="Hymn-repeatMarker">
                            {/* {copy(times, () => ":").join(",")} */}
                            (x{times})
                        </span>
                    </span>
                );
            })}
        </>
    );
}

function Line({line}: {line: string}) {
    const [{highlight}] = useDisplayOptions();
    let renderedText: React.ReactNode = line;
    if (highlight) {
        renderedText = replaceAll(line, new RegExp(highlight, "gi"), substr => (
            <span className="highlight">{substr}</span>
        ));
    }
    const noSpaceAfter = line.slice(-1) === EM_DASH;
    return (
        <>
            <span
                className={
                    "Hymn-line" + (noSpaceAfter ? " Hymn-line--nospaceafter" : "")
                }
            >
                {renderedText}
            </span>
            {/* Allow for line-breaks after em dashes */}
            {noSpaceAfter ? ZERO_WIDTH_SPACE : " "}
        </>
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
