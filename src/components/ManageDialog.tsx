import React from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";

import * as types from "../types";
import * as bookService from "../bookService";
import { useAppState } from "../state";
import { useFilePicker } from "../util/useFilePicker";

import { ReactComponent as DeleteIcon } from "../icons/delete.svg";

export let ManageDialog = () => {
    let queryClient = useQueryClient();

    let uploadMutation = useMutation(bookService.uploadBook, {
        onSuccess: newBook => {
            queryClient.invalidateQueries("summaries");
            queryClient.invalidateQueries(["book", newBook.id]);
            queryClient.invalidateQueries(["indexOfLines", newBook.id]);
        },
    });

    let filepicker = useFilePicker<HTMLDivElement>(
        async (filelist: FileList) => {
            for (let file of filelist) {
                uploadMutation.mutate(await file.text());
            }
        },
        { accept: "text/xml", multiple: true }
    );

    let [inputValue, setInputValue] = React.useState("");

    return (
        <div className="ManageDialog">
            <div className="controls">
                <button className="Button" onClick={filepicker.promptForFiles}>
                    Add book(s)...
                </button>
                {filepicker.hiddenFileInput}
            </div>

            <div className="fromURL">
                <label htmlFor="url-input">Or import a book from an external URL:</label>
                <input
                    type="url"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="https://example.com/book.xml"
                />
                <button
                    className="Button"
                    onClick={() => {
                        fetch(inputValue).then(res => {
                            if (res.status === 200) {
                                res.text().then(text => uploadMutation.mutate(text));
                                setInputValue("");
                            } else
                                window.alert(`Error "${res.status} ${res.statusText}"`);
                        });
                    }}
                >
                    Import
                </button>
            </div>

            <div
                className={"well" + (filepicker.isOver ? " is-over" : "")}
                {...filepicker.innerProps}
                ref={filepicker.innerRef}
            >
                <BookList isLoading={uploadMutation.isLoading} />

                <div className="dropMessage">
                    <p>
                        Drop your book XML files here. XML files should conform to the{" "}
                        <a href="/schema.xsd" target="_blank">
                            schema
                        </a>
                        .
                    </p>
                    <p>
                        <strong>Warning:</strong> Imported files will not be validated.
                        This process has minimal error-checking and malformed files may
                        crash the app.
                    </p>
                    <p>
                        If this happens, you can recover by clearing cookies and website
                        data.
                    </p>
                </div>
            </div>
        </div>
    );
};

function BookList({ isLoading }: { isLoading: boolean }) {
    let [currentBook, setCurrentBook] = useAppState("app/currentBook");

    let queryClient = useQueryClient();

    let deleteMutation = useMutation(bookService.deleteBook, {
        onSuccess: (_result, bookId) => {
            queryClient.invalidateQueries("summaries");
            queryClient.invalidateQueries(["book", bookId]);
            queryClient.invalidateQueries(["indexOfLines", bookId]);

            if (bookId === currentBook) setCurrentBook(null, false);
        },
    });

    let summaries = useQuery<types.Summary[], Error>(
        "summaries",
        bookService.getAllSummaries
    );

    if (summaries.data) {
        if (isLoading) return <p className="message">Importing files...</p>;

        if (summaries.data.length === 0)
            return <p className="message">No books have been installed yet</p>;

        return (
            <ul className="bookList">
                {summaries.data.map(summary => (
                    <ListItem
                        key={summary.id}
                        summary={summary}
                        deleteBook={() => deleteMutation.mutate(summary.id)}
                    />
                ))}
            </ul>
        );
    }

    if (summaries.isLoading) return <p className="message">Loading...</p>;
    if (summaries.isError)
        return (
            <div className="message">
                <p>{summaries.error.message}</p>
                <p>
                    <button className="ButtonLink" onClick={() => summaries.refetch()}>
                        Try Again
                    </button>
                </p>
            </div>
        );
    return <>??</>;
}

function ListItem({
    summary,
    deleteBook,
}: {
    summary: types.Summary;
    deleteBook: () => void;
}) {
    let message = `Are you sure you want to delete "${summary.title}"?`;
    return (
        <li key={summary.id}>
            <b>{summary.title}</b>
            <button
                className="Button"
                onClick={() => {
                    if (window.confirm(message)) deleteBook();
                }}
            >
                <DeleteIcon /> Delete
            </button>
        </li>
    );
}
