import React from "react";
import { useQuery } from "react-query";

import { OptionsDialog } from "./OptionsDialog";
import { ManageDialog } from "./ManageDialog";
import { Book } from "./Book";

import * as types from "../types";
import * as bookService from "../bookService";
import { useAppState } from "../state";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import { useOnMouseDownOutside } from "../util/useOnMouseDownOutside";

import { ReactComponent as MenuIcon } from "../icons/menu_book.svg";
import { ReactComponent as SearchIcon } from "../icons/search.svg";
import { FindDialogBase } from "./FindDialogBase";
import { FindDialog } from "./FindDialog";
import { usePending } from "../util/usePending";
import DialogElement from "../elements/DialogElement";

export function App() {
    React.useLayoutEffect(() => {
        // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let root = document.documentElement;
        let setVar = () => root.style.setProperty("--vh100", window.innerHeight + "px");
        setVar();

        window.addEventListener("resize", setVar);
        return () => window.removeEventListener("resize", setVar);
    }, []);

    let [bookId, setCurrentBookId] = useAppState("app/currentBook");

    let [mode, setMode] = useAppState("app/mode");
    let summaries = useQuery("summaries", bookService.getAllSummaries);

    let book = useQuery<types.Hymnal | null, Error>(["book", bookId], async () => {
        if (bookId === null) return null;
        return bookService.getBook(bookId);
    });

    let showBookSpinner = usePending(book.isLoading, 10, 300);

    React.useEffect(() => {
        if (summaries.data) {
            if (!bookId && summaries.data.length > 0) {
                setCurrentBookId(summaries.data[0]!.id);
            } else if (bookId && summaries.data.length === 0) {
                setCurrentBookId(null);
            }
        }
    }, [bookId, summaries.data, setCurrentBookId]);

    let { isPromptable, promptToInstall } = useAddToHomeScreenPrompt();

    let findDialogRef = React.useRef<DialogElement>(null!);
    useOnMouseDownOutside(findDialogRef, (dialog, target) => {
        if (dialog.open && !target?.closest("#toolbar-find-button"))
            dialog.toggle(false);
    });

    let optionsDialogRef = React.useRef<DialogElement>(null!);
    useOnMouseDownOutside(optionsDialogRef, (dialog, target) => {
        if (dialog.open && !target?.closest("#toolbar-options-button"))
            dialog.toggle(false);
    });

    return (
        <>
            <main className="App">
                <h1 className="title">{book.data?.title ?? "Hymnal Reader"}</h1>

                <nav className="Toolbar">
                    <super-menu-button
                        for="app-menu"
                        class="ToolbarButton"
                        aria-label="book switcher menu"
                        title="Menu"
                    >
                        <MenuIcon aria-hidden />
                    </super-menu-button>

                    {bookId === null ? (
                        <NumberInput disabled />
                    ) : (
                        <BoundNumberInput
                            bookId={bookId}
                            max={
                                book.data
                                    ? Object.keys(book.data.pages).length
                                    : undefined
                            }
                            disabled={!book.data}
                        />
                    )}
                    <button
                        className="ToolbarButton"
                        type="button"
                        aria-label="search"
                        id="toolbar-find-button"
                        onClick={() =>
                            setMode(mode => (mode === "find" ? "read" : "find"))
                        }
                    >
                        <SearchIcon aria-hidden />
                    </button>
                    <button
                        className="ToolbarButton"
                        aria-label="settings"
                        title="Settings"
                        onClick={() =>
                            setMode(mode => (mode === "options" ? "read" : "options"))
                        }
                        id="toolbar-options-button"
                    >
                        <span aria-hidden>Aa</span>
                    </button>
                </nav>

                {showBookSpinner ? (
                    <div className="loading">Loading...</div>
                ) : book.data ? (
                    <Book book={book.data} />
                ) : book.isError ? (
                    <div className="loading">{book.error.message}</div>
                ) : !book.isLoading ? (
                    <div className="loading">There are no books available.</div>
                ) : null}
            </main>

            <super-menu id="app-menu">
                <button
                    role="menuitem"
                    onClick={promptToInstall}
                    aria-disabled={!isPromptable}
                    accessKey="i"
                >
                    <u>I</u>nstall to Home Screen
                </button>
                <button role="menuitem" accessKey="m" onClick={() => setMode("manage")}>
                    <u>M</u>anage Books...
                </button>

                <div role="separator" />

                {summaries.data ? (
                    <>
                        {summaries.data.map(summary => {
                            let isCurrent = bookId === summary.id;
                            return (
                                <button
                                    key={summary.id}
                                    role="menuitemradio"
                                    aria-checked={isCurrent}
                                    onClick={() => {
                                        if (!isCurrent) {
                                            // Push new location to history stack
                                            setCurrentBookId(summary.id, false);
                                        }
                                    }}
                                >
                                    {isCurrent && "✓"} {summary.title}
                                </button>
                            );
                        })}

                        {summaries.data.length === 0 && (
                            <div role="menuitem" aria-disabled>
                                No books installed
                            </div>
                        )}
                    </>
                ) : (
                    <div role="menuitem" aria-disabled>
                        Loading...
                    </div>
                )}
            </super-menu>

            <ManageDialog
                open={mode === "manage"}
                onToggle={open => (open ? setMode("manage", false) : setMode("read"))}
            />

            <OptionsDialog
                open={mode === "options"}
                ref={optionsDialogRef}
                onToggle={open => (open ? setMode("options", false) : setMode("read"))}
            />

            {book.data ? (
                <FindDialog
                    ref={findDialogRef}
                    book={book.data}
                    open={mode === "find"}
                    onToggle={open => (open ? setMode("find", false) : setMode("read"))}
                />
            ) : (
                <FindDialogBase
                    ref={findDialogRef}
                    open={mode === "find"}
                    onToggle={open => (open ? setMode("find", false) : setMode("read"))}
                />
            )}
        </>
    );
}

function BoundNumberInput({
    bookId,
    max,
    disabled = false,
}: {
    bookId: types.DocumentId;
    max?: number;
    disabled?: boolean;
}) {
    let [loc, setLoc] = useAppState(`book/${bookId}/loc`);
    return (
        <NumberInput
            disabled={disabled}
            value={loc ?? ""}
            onSubmit={newLoc => {
                // push new location to history stack
                setLoc(newLoc, false);
                (
                    document.querySelector(
                        `[data-page="${newLoc}"]`
                    ) as HTMLElement | null
                )?.focus();
            }}
            max={max}
        />
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
        <div className="goto" role="presentation">
            <input
                disabled={disabled}
                type="number"
                value={inputValue}
                onFocus={e => e.target.select()}
                onChange={event => setInputValue(event.target.value)}
                onKeyDown={event => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        if (onSubmit) onSubmit(inputValue);
                    }
                }}
                aria-label="page number"
                max={max}
                min="1"
                placeholder="#"
            />
        </div>
    );
}
