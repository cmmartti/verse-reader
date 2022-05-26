import React from "react";
import * as idb from "idb-keyval";
import ReactDOM from "react-dom";

import { buildIndex } from "../buildIndex";
import { parseXML } from "../parseXML";
import * as types from "../types";
import { ReactComponent as BackIcon } from "../icons/arrow_back.svg";
import { ReactComponent as CloseIcon } from "../icons/close.svg";
import { ReactComponent as DeleteIcon } from "../icons/delete.svg";
import { useMatchMedia } from "../util/useMatchMedia";
import { useFilePicker } from "../util/useFilePicker";
import { useAppState, setAppState } from "../state";
import { SuperDialogElement } from "./SuperDialogElement";

export async function addBook(xmlDocument: XMLDocument) {
    let book = parseXML(xmlDocument);
    let searchIndex = buildIndex(book).toJSON();

    await idb.setMany([
        [`book/${book.id}`, book],
        [`searchIndex/${book.id}`, searchIndex],
    ]);
}

export function ManageDialog() {
    let big = useMatchMedia("(min-width: 29rem)");

    let [installedBooks, setInstalledBooks] = useAppState("app/installedBooks");
    let [isLoading, setIsLoading] = React.useState(false);

    let filepicker = useFilePicker<HTMLDivElement>(
        async (filelist: FileList) => {
            setIsLoading(true);

            for (let file of filelist) {
                let xmlString = await file.text();
                let xmlDocument = new DOMParser().parseFromString(xmlString, "text/xml");

                let book = parseXML(xmlDocument);
                if (installedBooks.includes(book.id)) {
                    // error
                } else {
                    await idb.set(`book/${book.id}`, book);
                    setInstalledBooks(prevList => [...prevList, book.id]);
                    setAppState(`book/${book.id}/title`, book.title);
                    setAppState(`book/${book.id}/year`, book.year);
                    setAppState(`book/${book.id}/publisher`, book.publisher);
                }
            }

            setIsLoading(false);
        },
        { accept: "text/xml", multiple: true }
    );

    let [mode, setMode] = useAppState("app/mode");

    let dialogRef = React.useRef<SuperDialogElement>(null!);

    React.useEffect(() => {
        let dialog = dialogRef.current;

        function onToggle(event: Event) {
            if ((event.target as SuperDialogElement).open) setMode("manage", false);
            else setMode("read");
        }

        dialog.addEventListener("toggle", onToggle);
        return () => dialog.removeEventListener("toggle", onToggle);
    });

    return (
        <super-dialog
            ref={dialogRef}
            id="manage-dialog"
            aria-labelledby="manage-dialog-title"
            open={mode === "manage" ? "" : null}
            class="Dialog ManageDialog"
        >
            <div className="header">
                <button
                    className="Button backButton"
                    data-super-dialog-close
                    aria-label="close dialog"
                >
                    {big ? <CloseIcon /> : <BackIcon />}
                </button>
                <h1 id="manage-dialog-title" className="title">
                    Manage Books
                </h1>
            </div>

            <div className="controls">
                <button className="Button" onClick={filepicker.promptForFiles}>
                    Add book(s)...
                </button>
                {filepicker.hiddenFileInput}
            </div>

            <div className="contents">
                <div
                    className={"documentsList" + (filepicker.isOver ? " is-over" : "")}
                    {...filepicker.innerProps}
                    ref={filepicker.innerRef}
                >
                    {installedBooks.map(bookId => (
                        <BookEntry key={bookId} bookId={bookId} />
                    ))}

                    {installedBooks.length === 0 && (
                        <div>No books have been installed.</div>
                    )}

                    {isLoading && <div>Loading...</div>}
                    <p>(Or drag and drop your book files here)</p>
                </div>
            </div>
        </super-dialog>
    );
}

function handleDelete(bookId: string, title: string) {
    return async function () {
        if (window.confirm(`Are you sure you want to delete "${title}?"`)) {
            await idb.del(`book/${bookId}`);
            await idb.del(`searchIndex/${bookId}`);

            setAppState("app/installedBooks", prevList => {
                let index = prevList.indexOf(bookId);
                return [...prevList.slice(0, index), ...prevList.slice(index + 1)];
            });

            // for (let key of Object.keys(getAll())) {
            //     if (key.match(RegExp("^book/" + bookId + "/"))) {
            //         del(key);
            //     }
            // }
        }
    };
}

function BookEntry({ bookId }: { bookId: types.DocumentId }) {
    let [title] = useAppState(`book/${bookId}/title`);

    return (
        <div>
            {title ?? bookId}
            <button className="Button" onClick={handleDelete(bookId, title ?? bookId)}>
                <DeleteIcon /> Delete
            </button>
        </div>
    );
}
