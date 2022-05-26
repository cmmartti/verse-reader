import React from "react";
import * as idb from "idb-keyval";

import "../styles/index.scss";

import * as types from "../types";
import { useAppState } from "../state";
import { useLoader } from "../util/useLoader";
import { Toolbar } from "./Toolbar";
import { AppMenu } from "./AppMenu";
import { OptionsDialog } from "./OptionsDialog";
import { ManageDialog } from "./ManageDialog";
import { Book } from "./Book";
import { FindDialog } from "./Find/FindDialog";

const root = document.documentElement;

export function App() {
    React.useLayoutEffect(() => {
        // https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
        let setVar = () => root.style.setProperty("--vh100", window.innerHeight + "px");
        setVar();
        window.addEventListener("resize", setVar);
        return () => window.removeEventListener("resize", setVar);
    }, []);

    let [bookId, setCurrentBookId] = useAppState("app/currentBook");
    let [installedBooks] = useAppState("app/installedBooks");

    // If a book is installed for the first time, open it immediately
    React.useEffect(() => {
        if (bookId === null && installedBooks[0]) {
            setCurrentBookId(installedBooks[0]);
        }
    }, [bookId, setCurrentBookId, installedBooks]);

    let bookLoader = useLoader({
        key: `book/${bookId}`,
        loader: React.useCallback(async () => {
            if (bookId === null) return null;
            let book = await idb.get<types.HymnalDocument>(`book/${bookId}`);
            if (book === undefined) {
                // error
            }
            return book as types.HymnalDocument;
        }, [bookId]),
        pendingMs: 100,
        pendingMinMs: 300,
    });

    let book = bookLoader.mode === "success" ? bookLoader.value : null;

    return (
        <main className="App">
            <Toolbar book={bookLoader.mode === "success" ? bookLoader.value : null} />

            {bookLoader.mode === "loading" && (
                <div className="loading">
                    <p>Loading...</p>
                </div>
            )}
            {bookLoader.mode === "success" &&
                (bookLoader.value !== null ? (
                    <Book book={bookLoader.value} />
                ) : (
                    <div className="loading">
                        <p>No books installed.</p>
                    </div>
                ))}

            {bookLoader.mode === "idle" && (
                <div className="loading">
                    <p>That book is not installed.</p>
                </div>
            )}

            <AppMenu />
            <ManageDialog />
            <OptionsDialog />
            <FindDialog book={book} />
        </main>
    );
}
