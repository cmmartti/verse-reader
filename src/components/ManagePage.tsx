import React from "react";
import { Link } from "react-router-dom";

import { ReactComponent as DeleteIcon } from "../assets/delete_black_24dp.svg";
import { useFilePicker } from "../util/useFilePicker";
import {
    DocumentMetadata,
    getDocuments,
    addDocument,
    deleteDocument,
} from "../util/documentRepository";

export function ManagePage() {
    const [bookList, setBookList] = React.useState<DocumentMetadata[]>(getDocuments());

    const addBook = React.useCallback((newBook: XMLDocument) => {
        const res = addDocument(newBook);
        if (res.isOk) setBookList(getDocuments());
        return res.unwrap();
    }, []);

    const deleteBook = React.useCallback((id: string) => {
        const res = deleteDocument(id);
        if (res.isOk) setBookList(getDocuments());
        return res.unwrap();
    }, []);

    const filepicker = useFilePicker<HTMLDivElement>(
        (filelist: FileList) => {
            [...filelist].forEach(async file => {
                const xmlString = await file.text();
                const hymnal = new DOMParser().parseFromString(xmlString, "text/xml");
                addBook(hymnal);
            });
        },
        { accept: "text/xml", multiple: true }
    );

    function handleDelete(document: DocumentMetadata) {
        return function () {
            if (window.confirm(`Are you sure you want to delete "${document.title}?"`))
                deleteBook(document.id);
        };
    }

    return (
        <div className="PageHome">
            <h1 className="PageHome-title">Manage Books</h1>
            <Link to="/">Exit</Link>

            <div className="PageHome-documentsList">
                {bookList.length === 0 && <div>No books have been installed.</div>}
                {bookList.map(hymnal => (
                    <div key={hymnal.id}>
                        {hymnal.title}
                        <button className="Button" onClick={handleDelete(hymnal)}>
                            <DeleteIcon /> Delete
                        </button>
                    </div>
                ))}
            </div>

            <h2>Add a Book</h2>
            <div
                {...filepicker.innerProps}
                ref={filepicker.innerRef}
                className={"filepicker" + (filepicker.isOver ? " is-over" : "")}
            >
                <button className="Button" onClick={filepicker.promptForFiles}>
                    Select a book to install
                </button>
                <p>Or drag and drop your book files here</p>
                {filepicker.hiddenFileInput}
            </div>
        </div>
    );
}
