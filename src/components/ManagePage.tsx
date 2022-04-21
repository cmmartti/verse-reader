import React from "react";
import { Link } from "@tanstack/react-location";

import { ReactComponent as DeleteIcon } from "../assets/delete_black_24dp.svg";
import { useFilePicker } from "../util/useFilePicker";
import { addDocument, deleteDocument, getDocumentList } from "../db";
import * as types from "../types";

export function ManagePage({ list }: { list: types.Metadata[] }) {
    let [documentList, setDocumentList] = React.useState(list || []);
    let [isLoading, setIsLoading] = React.useState(false);

    let filepicker = useFilePicker<HTMLDivElement>(
        async (filelist: FileList) => {
            setIsLoading(true);

            for (let file of filelist) {
                let xmlString = await file.text();
                let xmlDocument = new DOMParser().parseFromString(xmlString, "text/xml");
                await addDocument(xmlDocument);
            }

            setDocumentList(await getDocumentList());
            setIsLoading(false);
        },
        { accept: "text/xml", multiple: true }
    );

    function handleDelete(id: string, title: string) {
        return async function () {
            if (window.confirm(`Are you sure you want to delete "${title}?"`)) {
                await deleteDocument(id);
                setDocumentList(await getDocumentList());
            }
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
                {isLoading && <div>Loading...</div>}
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
