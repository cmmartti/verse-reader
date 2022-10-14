import React from "react";
import { Link, useParams, useRouteLoaderData, useNavigate } from "react-router-dom";

import * as types from "../types";
import { ReactComponent as TOCIcon } from "../icons/toc.svg";
// import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";
// import { ReactComponent as ForwardIcon } from "../icons/arrow-forward-ios.svg";

import { useTapActions } from "../util/useTapActions";
import { Hymn } from "./Hymn";
import { useMatchMedia } from "../util/useMatchMedia";
import { NavigationBar } from "./NavigationBar";
import { useLockBodyScroll } from "../util/useLockBodyScroll";
import { useAppState } from "../state";
import { DEFAULT_STATE, stateToParams } from "./BookIndex";

export function Book() {
    let navigate = useNavigate();
    useLockBodyScroll();

    let file = useRouteLoaderData("book") as types.Hymnal;
    let params = useParams() as { id: types.DocumentId; loc: types.HymnId };

    let locs = React.useMemo(
        () => Object.values(file.pages).map(page => page.id),
        [file]
    );

    let setLoc = React.useCallback(
        (loc: string) => {
            navigate(`/${params.id!}/${loc}`, { replace: true });
        },
        [navigate, params.id]
    );

    let currentLocRef = React.useRef(params.loc!);
    React.useEffect(() => {
        currentLocRef.current = params.loc!;
    });

    let nextLoc = React.useMemo(() => {
        let currentIndex = locs.findIndex(loc => loc === params.loc);
        return locs[Math.min(locs.length - 1, currentIndex + 1)]!;
    }, [params.loc, locs]);

    let prevLoc = React.useMemo(() => {
        let currentIndex = locs.findIndex(loc => loc === params.loc);
        return locs[Math.max(0, currentIndex - 1)]!;
    }, [params.loc, locs]);

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
                    setLoc(nextLoc);
                    break;
                case "p":
                case "ArrowLeft":
                    event.preventDefault();
                    setLoc(prevLoc);
                    break;
            }
        };
        document.addEventListener("keydown", fn);
        return () => document.removeEventListener("keydown", fn);
    }, [nextLoc, prevLoc, setLoc]);

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
        canvasRef.current.scrollTop =
            (scrollPositions.current.get(params.loc!) ?? 0) *
            canvasRef.current.clientHeight;
    }, [params.loc]);

    let isMobile = useMatchMedia("(max-width: 29rem)");

    let [isExpanded, setIsExpanded] = React.useState(false);

    useTapActions(canvasRef, {
        left: () => setLoc(prevLoc),
        right: () => setLoc(nextLoc),
        middle: () => setIsExpanded(val => !val),
    });

    let input = (
        <NumberInput
            value={params.loc}
            onSubmit={value => setLoc(value)}
            onEnter={() => canvasRef.current.focus()}
        />
    );

    let [lastIndexState] = useAppState(`book/${params.id}/index`, DEFAULT_STATE);
    let indexLink = (
        <Link
            className="Button"
            aria-label="index"
            title="Index"
            to={"index?" + stateToParams(lastIndexState)}
        >
            <TOCIcon />
        </Link>
    );

    let optionsLink = (
        <Link
            className="Button"
            aria-label="appearance"
            title="Appearance"
            to={"options"}
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
                        !isMobile && (
                            <React.Fragment>
                                {input}
                                {indexLink}
                                {optionsLink}
                            </React.Fragment>
                        )
                    }
                />
            )}

            <div className="-canvas" ref={canvasRef} tabIndex={-1}>
                <Hymn key={params.loc} hymn={file.pages[params.loc!]!} book={file} />
            </div>

            {isMobile && !isExpanded && (
                <div className="-bottombar">
                    {/* <button
                        className="Button"
                        onClick={back}
                        disabled={params.loc === locs[0]}
                    >
                        <BackIcon />
                    </button>
                    <button
                        className="Button"
                        onClick={forward}
                        disabled={params.loc === locs[locs.length - 1]}
                    >
                        <ForwardIcon />
                    </button> */}
                    {optionsLink}
                    {input}
                    {indexLink}
                </div>
            )}
        </main>
    );
}

function NumberInput({
    value,
    onEnter,
    onSubmit,
    disabled = false,
    max,
}: {
    value: types.HymnId;
    onSubmit: (value: string) => void;
    onEnter: () => void;
    disabled?: boolean;
    max?: number;
}) {
    let [inputValue, setInputValue] = React.useState(value);

    // If the value changes, discard unsubmitted user input
    React.useEffect(() => {
        setInputValue(value ?? "");
    }, [value]);

    return (
        <div className="AddressBar">
            <input
                disabled={disabled}
                type="text"
                inputMode="decimal"
                enterKeyHint="go"
                value={inputValue}
                onKeyDown={e => {
                    switch (e.key) {
                        case "Enter":
                            if (inputValue) {
                                onSubmit(inputValue);
                                onEnter();
                            } else setInputValue(value);
                            break;
                        case "Escape":
                            setInputValue(value);
                            onEnter();
                            break;
                    }
                }}
                onFocus={e => e.target.select()}
                onBlur={() => {
                    if (inputValue) onSubmit(inputValue);
                    else setInputValue(value);
                }}
                onChange={event => setInputValue(event.target.value)}
                aria-label="page number"
                max={max}
                min="1"
            />
        </div>
    );
}
