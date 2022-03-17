import React from "react";
import { useMatch, Link } from "@tanstack/react-location";

import { ReactComponent as DeleteIcon } from "../assets/delete_black_24dp.svg";
import { useFilePicker } from "../util/useFilePicker";
import { addDocument, deleteDocument } from "../db";
import { LocationGenerics } from "./App";

export function ManagePage() {
    let { data } = useMatch<LocationGenerics>();
    let documentList = data.documents!;

    let filepicker = useFilePicker<HTMLDivElement>(
        (filelist: FileList) => {
            [...filelist].forEach(async file => {
                let xmlString = await file.text();
                let xmlDocument = new DOMParser().parseFromString(xmlString, "text/xml");
                addDocument(xmlDocument);
            });
        },
        { accept: "text/xml", multiple: true }
    );

    function handleDelete(id: string, title: string) {
        return function () {
            if (window.confirm(`Are you sure you want to delete "${title}?"`))
                deleteDocument(id);
        };
    }

    return (
        <div className="ManagePage">
            <h1 className="ManagePage-title">Manage Books</h1>
            <Link to="/">Exit</Link>

            <div className="ManagePage-documentsList">
                {documentList.length === 0 && <div>No books have been installed.</div>}
                {documentList.map(document => (
                    <div key={document.id}>
                        {document.title}
                        <button
                            className="Button"
                            onClick={handleDelete(document.id, document.title)}
                        >
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
