import React from "react";
import { useQuery } from "react-query";

import { OptionsPanel } from "./OptionsPanel";
import { ManageDialog } from "./ManageDialog";
import { Page } from "./Page";

import * as types from "../types";
import * as bookService from "../bookService";
import { useAppState } from "../state";

import { ReactComponent as MenuIcon } from "../icons/menu.svg";
import { ReactComponent as TOCIcon } from "../icons/toc.svg";
import { FindPanelBase } from "./FindPanelBase";
import { FindPanel } from "./FindPanel";
import { usePending } from "../util/usePending";
import { useLocationState } from "../locationState";
import { ErrorBoundary } from "./ErrorBoundary";
import { fonts } from "../fonts";

const ROOT = document.documentElement;

export function App() {
    React.useLayoutEffect(() => {
        // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let root = document.documentElement;
        let setVar = () => root.style.setProperty("--vh100", window.innerHeight + "px");
        setVar();

        window.addEventListener("resize", setVar);
        return () => window.removeEventListener("resize", setVar);
    }, []);

    let [colorScheme] = useAppState("app/colorScheme");
    React.useLayoutEffect(() => {
        ROOT.setAttribute("data-color-scheme", colorScheme);
    }, [colorScheme]);

    let [fontSize] = useAppState("app/fontSize");
    React.useLayoutEffect(() => {
        ROOT.style.setProperty("--ui-scale-factor", fontSize.toString());
    }, [fontSize]);

    let [fontFamily] = useAppState("app/fontFamily");
    React.useLayoutEffect(() => {
        ROOT.style.setProperty(
            "--page-font-family",
            (fonts.find(font => font.id === fontFamily) ?? fonts[0]!).value
        );
    }, [fontFamily]);

    let [bookId, setCurrentBookId] = useLocationState("book");
    let [sidebar, setSidebar] = useLocationState("sidebar");
    let [manage, setManage] = useLocationState("manage");

    let summaries = useQuery("summaries", bookService.getAllSummaries);

    let book = useQuery<types.Hymnal | null, Error>(["book", bookId], async () => {
        if (bookId === null) return null;
        return bookService.getBook(bookId);
    });

    let showBookSpinner = usePending(book.isLoading, 100, 300);

    React.useEffect(() => {
        if (summaries.data) {
            if (!bookId && summaries.data.length > 0) {
                setCurrentBookId(summaries.data[0]!.id);
            } else if (bookId && summaries.data.length === 0) {
                setCurrentBookId(null);
            }
        }
    }, [bookId, summaries.data, setCurrentBookId]);

    let pageRef = React.useRef<HTMLDivElement>(null!);

    return (
        <ErrorBoundary>
            <main className="App">
                <div className="App-canvas">
                    <h1 className="Titlebar">
                        <super-menu-button
                            for="app-menu"
                            class="App-switcher"
                            aria-label="book switcher menu"
                            title="Menu"
                        >
                            <MenuIcon aria-hidden />
                            {showBookSpinner
                                ? ""
                                : book.data?.title
                                ? book.data.title + " - Reader"
                                : "Reader"}
                        </super-menu-button>
                    </h1>

                    <div className="Page" ref={pageRef} tabIndex={-1}>
                        {showBookSpinner ? (
                            <div className="StatusMessage">Loading...</div>
                        ) : book.data ? (
                            <Page book={book.data} />
                        ) : book.isError ? (
                            <div className="StatusMessage">{book.error.message}</div>
                        ) : !book.isLoading ? (
                            <div className="StatusMessage">
                                There are no books available.
                            </div>
                        ) : null}
                    </div>

                    <nav className="Toolbar">
                        <button
                            className="Toolbar-button"
                            type="button"
                            aria-label="search index"
                            title="View Index"
                            id="toolbar-find-button"
                            onClick={() =>
                                sidebar === "find"
                                    ? setSidebar(null)
                                    : setSidebar("find", false)
                            }
                            aria-haspopup
                            aria-expanded={sidebar === "find"}
                        >
                            <TOCIcon aria-hidden />
                        </button>

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
                                onSubmit={() => {
                                    pageRef.current.focus();
                                }}
                            />
                        )}

                        <button
                            className="Toolbar-button"
                            aria-label="appearance"
                            title="Appearance"
                            onClick={() =>
                                sidebar === "options"
                                    ? setSidebar(null)
                                    : setSidebar("options", false)
                            }
                            id="toolbar-options-button"
                            aria-haspopup
                            aria-expanded={sidebar === "options"}
                        >
                            Aa
                        </button>
                    </nav>
                </div>

                {book.data ? (
                    <FindPanel
                        book={book.data}
                        open={sidebar === "find"}
                        onClose={() => setSidebar(null)}
                    />
                ) : (
                    <FindPanelBase
                        open={sidebar === "find"}
                        onClose={() => setSidebar(null)}
                    />
                )}

                <OptionsPanel
                    open={sidebar === "options"}
                    onClose={() => setSidebar(null)}
                />
            </main>

            <ManageDialog open={manage} onClose={() => setManage(false)} />

            <super-menu id="app-menu">
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
                                        if (!isCurrent)
                                            setCurrentBookId(summary.id, false);
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

                <div role="separator" />
                <button
                    role="menuitem"
                    accessKey="m"
                    onClick={() => setManage(true, false)}
                >
                    <u>M</u>anage Books...
                </button>
            </super-menu>
        </ErrorBoundary>
    );
}

function BoundNumberInput({
    bookId,
    max,
    disabled = false,
    onSubmit,
}: {
    bookId: types.DocumentId;
    max?: number;
    disabled?: boolean;
    onSubmit?: (value: string) => void;
}) {
    let [loc, setLoc] = useLocationState(`book/${bookId}/loc`);
    return (
        <NumberInput
            disabled={disabled}
            value={loc ?? ""}
            onSubmit={newLoc => {
                // push new location to history stack
                setLoc(newLoc, false);
                onSubmit?.(newLoc);
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
        <form
            className="Toolbar-input"
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
