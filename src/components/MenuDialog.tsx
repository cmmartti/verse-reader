import React from "react";
import { Link } from "@tanstack/react-location";

import * as types from "../types";
import { Dialog } from "./Dialog";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import { useMatchMedia } from "../util/useMatchMedia";

export function MenuDialog({
    document,
    documents,
}: {
    document: types.HymnalDocument;
    documents: types.Metadata[];
}) {
    let { isPromptable, promptToInstall } = useAddToHomeScreenPrompt();

    let toolbarOnBottom = useMatchMedia("(max-width: 29rem)");

    return (
        <Dialog id="menu-dialog" title="Menu" className="MenuDialog">
            {/* {toolbarOnBottom && } */}
            <button
                className="Button"
                onClick={promptToInstall}
                disabled={!isPromptable}
            >
                Install to Home Screen
            </button>
            <div>
                <Link to="/manage">Manage Books…</Link>
            </div>
            <hr />
            <ul>
                {documents.map(d => (
                    <li key={d.id}>
                        <Link to={"/" + d.id}>
                            {d.title} {d.id === document.id && "✓"}
                        </Link>
                    </li>
                ))}
            </ul>
        </Dialog>
    );
}
