import React from "react";

import * as types from "../types";
import c from "../util/c";
import { useAppState } from "../state";

type VerseFragment = {
    kind: "verse";
    verseNumber: number;
    lines: (types.Line | types.RepeatLines | PointerFragment | SpecialFragment)[];
    attachment?: SpecialFragment;
    isDeleted: boolean;
};

type SpecialFragment = {
    kind: "special";
    lines: (types.Line | types.RepeatLines)[];
    label?: string;
};

type PointerFragment = {
    kind: "pointer";
    text: string;
    a11yText: string;
};

export function Verses({ hymn }: { hymn: types.Hymn }) {
    let [expandRepeatedLines] = useAppState("hymn/expandRepeatedLines", false);
    let [repeatRefrain] = useAppState("hymn/repeatRefrain", true);
    let [repeatChorus] = useAppState("hymn/repeatChorus", false);

    let verses: VerseFragment[] = hymn.verses.map((verse, i) => {
        let verseNumber = i + 1;
        let lines: (
            | types.Line
            | types.RepeatLines
            | PointerFragment
            | SpecialFragment
        )[] = processLines(verse.lines, expandRepeatedLines);
        let attachment: SpecialFragment | undefined;

        if (hymn.chorus) {
            if (repeatChorus) {
                attachment = {
                    kind: "special" as const,
                    lines: processLines(hymn.chorus.lines, expandRepeatedLines),
                };
            } else if (verseNumber === 1) {
                attachment = {
                    kind: "special",
                    lines: processLines(hymn.chorus.lines, expandRepeatedLines),
                    label: "Chorus:",
                } as SpecialFragment;
            } else {
                lines.push({
                    kind: "pointer",
                    text: "Chorus:",
                    a11yText: "Chorus repeats here.",
                } as PointerFragment);
            }
        }

        if (hymn.refrain) {
            if (repeatRefrain) {
                lines.push({
                    kind: "special",
                    lines: processLines(hymn.refrain.lines, expandRepeatedLines),
                    label: "Refrain:",
                } as SpecialFragment);
            } else if (verseNumber === 1) {
                attachment = {
                    kind: "special",
                    lines: processLines(hymn.refrain.lines, expandRepeatedLines),
                    label: "Refrain:",
                } as SpecialFragment;
            } else {
                lines.push({
                    kind: "pointer",
                    text: "Refrain:",
                    a11yText: "Refrain repeats here.",
                } as PointerFragment);
            }
        }

        return {
            kind: "verse",
            verseNumber,
            lines,
            attachment,
            isDeleted: verse.isDeleted,
        };
    });

    return (
        <div className="Hymn-verses">
            {verses.map(verse => (
                <React.Fragment key={verse.verseNumber}>
                    <p className={"Hymn-verse" + c("is-deleted", verse.isDeleted)}>
                        <span className="Hymn-verseNumber">
                            <span className="visually-hidden" role="presentation">
                                Verse{" "}
                            </span>
                            {verse.verseNumber}
                            {verse.isDeleted && (
                                <span className="visually-hidden" role="presentation">
                                    , deleted{" "}
                                </span>
                            )}
                            .
                        </span>{" "}
                        <span className="Hymn-verseLines">
                            <Lines lines={verse.lines} isLast />
                        </span>
                    </p>

                    {verse.attachment && (
                        <p className="Hymn-attachment">
                            {verse.attachment.label && (
                                <span className="Hymn-attachmentLabel">
                                    {verse.attachment.label}{" "}
                                </span>
                            )}
                            <span className="Hymn-verseLines">
                                <Lines lines={verse.attachment.lines} isLast />
                            </span>
                        </p>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function processLines(
    lines: (types.Line | types.RepeatLines)[],
    expandRepeatedLines: boolean
) {
    return lines.flatMap(line => {
        if (line.kind === "repeat") {
            let repeat = line;

            if (expandRepeatedLines)
                return wrapLines(
                    [...Array(repeat.times)].flatMap(() => repeat.lines),
                    repeat.before,
                    repeat.after
                );

            return {
                kind: "repeat",
                times: repeat.times,
                lines: wrapLines(repeat.lines, repeat.before, repeat.after),
            } as types.RepeatLines;
        }

        return line;
    });
}

function wrapLines(lines: types.Line[], before?: string, after?: string) {
    return lines.map((line, i) => {
        let text = line.text;
        if (before && i === 0) text = before + text;
        if (after && i === lines.length - 1) text = text + after;
        return { ...line, text } as types.Line;
    });
}

function Lines({
    lines,
    isLast = false,
}: {
    lines: (types.Line | types.RepeatLines | PointerFragment | SpecialFragment)[];
    isLast?: boolean;
}) {
    return (
        <React.Fragment>
            {lines.map((line, i) => {
                let _isLast = isLast && i === lines.length - 1;
                if (line.kind === "line")
                    return <Line key={i} line={line} isLast={_isLast} />;
                if (line.kind === "repeat")
                    return <RepeatLines key={i} repeat={line} isLast={_isLast} />;
                if (line.kind === "special")
                    return <SpecialLines key={i} special={line} isLast={_isLast} />;
                if (line.kind === "pointer")
                    return <Pointer key={i} pointer={line} isLast={_isLast} />;
                return null;
            })}
        </React.Fragment>
    );
}

function Line({ line, isLast }: { line: types.Line; isLast: boolean }) {
    if (isLast) {
        return <span className="Hymn-line">{line.text}</span>;
    }

    let start = line.text.slice(0, line.text.length - 1);
    let lastChar = line.text.slice(line.text.length - 1);
    return (
        <span className="Hymn-line">
            {start}

            <span style={{ whiteSpace: "nowrap" }}>
                {lastChar}
                <span className="Hymn-lineSeparator"></span>
            </span>

            <span style={{ display: "inline-block", width: 0 }}> </span>
        </span>
    );
}

function RepeatLines({
    repeat,
    isLast,
}: {
    repeat: types.RepeatLines;
    isLast: boolean;
}) {
    return (
        <span className="Hymn-repeat" role="presentation">
            <Lines lines={repeat.lines} />

            <span className="visually-hidden" role="presentation">
                {[...Array(repeat.times - 1)].map((_, i) => (
                    <Lines key={i} lines={repeat.lines} isLast />
                ))}
            </span>

            <span style={{ whiteSpace: "nowrap" }}>
                <span className="Hymn-repeatLabel" aria-hidden>
                    {[...Array(repeat.times - 1)].map((_, i) => (
                        <React.Fragment>
                            […]
                            {i !== repeat.times - 2 && (
                                <span className="Hymn-lineSeparator"> </span>
                            )}
                        </React.Fragment>
                    ))}
                </span>
                {!isLast && <span className="Hymn-lineSeparator"> </span>}
            </span>
        </span>
    );
}

function SpecialLines({
    special,
    isLast,
}: {
    special: SpecialFragment;
    isLast: boolean;
}) {
    return (
        <span className="Hymn-specialLines">
            {special.label && <span className="visually-hidden">{special.label}</span>}
            <Lines lines={special.lines} isLast={isLast} />
        </span>
    );
}

function Pointer({ pointer, isLast }: { pointer: PointerFragment; isLast: boolean }) {
    return (
        <span className="Hymn-pointer">
            <span aria-hidden>{pointer.text}</span>
            <span className="visually-hidden" role="presentation">
                {pointer.a11yText}
            </span>
            {!isLast && <span className="Hymn-lineSeparator"> </span>}
        </span>
    );
}
