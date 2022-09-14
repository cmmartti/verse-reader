import React from "react";
import { Link, useMatch } from "@tanstack/react-location";

import * as types from "../types";
import { useOption } from "../options";
import { ManageDialog } from "./ManageDialog";

import { ReactComponent as BookIcon } from "../icons/article.svg";
import { ReactComponent as ArrowForward } from "../icons/arrow-forward-ios.svg";

export function Home() {
    let match = useMatch();
    let list = match.data.list as types.Summary[];

    let [autoOpen, setAutoOpen] = useOption("autoOpen");

    let [manageDialogOpen, setManageDialogOpen] = React.useState(false);

    return (
        <main className="Home">
            <h1>Library</h1>
            <div className="section">
                {list.map(book => (
                    <Link key={book.id} to={"/" + book.id}>
                        <BookIcon />
                        <div style={{ display: "flex", flexFlow: "column" }}>
                            {book.title} {book.year && `(${book.year})`}
                            <span className="subdued">{book.publisher}</span>
                        </div>
                        <span className="spacer" />
                        <ArrowForward />
                    </Link>
                ))}
            </div>

            {/* <div className="spacer" /> */}

            <div className="section">
                <button
                    className="section-button"
                    onClick={() => setManageDialogOpen(true)}
                >
                    Add books
                </button>
                <button className="section-button">Install to Home Screen</button>

                <label>
                    Auto-open last book
                    <span className="spacer" />
                    <input
                        type="checkbox"
                        checked={autoOpen}
                        onChange={event => setAutoOpen(event.target.checked)}
                    />{" "}
                </label>
            </div>

            <ManageDialog
                open={manageDialogOpen}
                onClose={() => setManageDialogOpen(false)}
            />
        </main>
    );
}
