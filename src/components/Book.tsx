import React from "react";
import { Link, useMatch } from "@tanstack/react-location";

import * as types from "../types";
import { ReactComponent as TOCIcon } from "../icons/toc.svg";
import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";
import { ReactComponent as ForwardIcon } from "../icons/arrow-forward-ios.svg";

import { useTapActions } from "../util/useTapActions";
import { Hymn } from "./Hymn";
import { useMatchMedia } from "../util/useMatchMedia";
import { NavigationBar } from "./NavigationBar";
import { useLoc } from "./App";

export function Book() {
    let match = useMatch();
    let file = match.data.file as types.Hymnal;

    let locs = React.useMemo(
        () => Object.values(file.pages).map(page => page.id),
        [file]
    );
    let defaultLoc = locs[0]!;
    let [currentLoc, setLoc] = useLoc(defaultLoc);

    let currentLocRef = React.useRef(currentLoc!);
    React.useEffect(() => {
        currentLocRef.current = currentLoc!;
    });

    let forward = React.useCallback(() => {
        let currentIndex = locs.findIndex(loc => loc === currentLoc);
        let newLoc = locs[Math.min(locs.length - 1, currentIndex + 1)]!;
        setLoc(newLoc, true);
    }, [currentLoc, locs, setLoc]);

    let back = React.useCallback(() => {
        let currentIndex = locs.findIndex(loc => loc === currentLoc);
        let newLoc = locs[Math.max(0, currentIndex - 1)]!;
        setLoc(newLoc, true);
    }, [currentLoc, locs, setLoc]);

    // If the current location is invalid, reset to the default location
    let locIsInvalid = currentLoc && !locs.includes(currentLoc);
    if (locIsInvalid) currentLoc = defaultLoc;
    React.useEffect(() => {
        if (locIsInvalid) setLoc(defaultLoc, true);
    }, [locIsInvalid, setLoc, defaultLoc]);

    React.useEffect(() => {
        let fn = (event: KeyboardEvent) => {
            let target = event.target as HTMLElement;
            if (target.nodeName === "INPUT" || target.nodeName === "TEXTAREA") {
                return;
            }

            switch (event.key) {
                case "n":
                case "ArrowRight":
                    event.preventDefault();
                    forward();
                    break;
                case "p":
                case "ArrowLeft":
                    event.preventDefault();
                    back();
                    break;
            }
        };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, [forward, back]);

    // Store the scroll position of this loc on each scroll event
    let scrollPositions = React.useRef(new Map<string, number>());
    React.useEffect(() => {
        let canvas = canvasRef.current;
        let fn = () => {
            let position = canvas.scrollTop / canvas.clientHeight;
            scrollPositions.current.set(currentLocRef.current, position);
        };
        canvas.addEventListener("scroll", fn);
        return () => canvas.removeEventListener("scroll", fn);
    }, []);

    let canvasRef = React.useRef<HTMLDivElement>(null!);
    let appRef = React.useRef<HTMLElement>(null!);

    // When the loc changes, revert the previously-stored scroll position
    React.useLayoutEffect(() => {
        appRef.current.scrollTop =
            (scrollPositions.current.get(currentLoc!) ?? 0) *
            appRef.current.clientHeight;
    }, [currentLoc]);

    let isMobile = useMatchMedia("(max-width: 29rem)");

    let [isExpanded, setIsExpanded] = React.useState(false);

    useTapActions(canvasRef, {
        left: back,
        right: forward,
        middle: () => setIsExpanded(val => !val),
    });

    let input = (
        <NumberInput value={currentLoc} onSubmit={value => setLoc(value, false)} />
    );

    let indexLink = (
        <Link
            className="Button"
            aria-label="index"
            title="Index"
            to={"index?loc=" + currentLoc}
        >
            <TOCIcon />
        </Link>
    );

    let optionsLink = (
        <Link
            className="Button"
            aria-label="appearance"
            title="Appearance"
            to={"options?loc=" + currentLoc}
        >
            Aa
        </Link>
    );

    return (
        <main className="App" ref={appRef}>
            {!isExpanded && (
                <NavigationBar
                    back={{ to: "/", title: "Library" }}
                    title={isMobile ? file.id : file.title}
                    tools={
                        !isMobile ? (
                            <React.Fragment>
                                {input}
                                {indexLink}
                                {optionsLink}
                            </React.Fragment>
                        ) : null
                    }
                />
            )}

            <div className="-canvas" ref={canvasRef} tabIndex={-1}>
                <Hymn key={currentLoc} hymn={file.pages[currentLoc!]!} book={file} />
            </div>

            {isMobile && !isExpanded && (
                <div className="-bottombar">
                    <button
                        className="Button"
                        onClick={back}
                        disabled={currentLoc === locs[0]}
                    >
                        <BackIcon />
                    </button>
                    <button
                        className="Button"
                        onClick={forward}
                        disabled={currentLoc === locs[locs.length - 1]}
                    >
                        <ForwardIcon />
                    </button>
                    {input}
                    {indexLink}
                    {optionsLink}
                </div>
            )}
        </main>
    );
}

function NumberInput({
    value = "",
    onSubmit,
    disabled = false,
    max,
}: {
    value?: types.HymnId;
    onSubmit?: (value: string) => void;
    disabled?: boolean;
    max?: number;
}) {
    let [inputValue, setInputValue] = React.useState(value);

    // If the value changes, discard unsubmitted user input
    React.useEffect(() => {
        setInputValue(value ?? "");
    }, [value]);

    return (
        <form
            className="NavigationBar-input"
            onSubmit={event => {
                event.preventDefault();
                onSubmit?.(inputValue);
            }}
        >
            <input
                disabled={disabled}
                type="number"
                value={inputValue}
                onFocus={e => e.target.select()}
                onChange={event => setInputValue(event.target.value)}
                aria-label="page number"
                max={max}
                min="1"
                placeholder="#"
            />
        </form>
    );
}
