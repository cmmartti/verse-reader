import React from "react";
import ReactDOM from "react-dom";

import * as types from "../../types";
import A11yTabs from "../../util/A11yTabs";
import { SearchPanel } from "./SearchPanel";
import { IndexPanel } from "./IndexPanel";
import { ListsPanel } from "./ListsPanel";
import { ReactComponent as BackIcon } from "../../icons/arrow_back.svg";
import { ReactComponent as CloseIcon } from "../../icons/close.svg";
import { useMatchMedia } from "../../util/useMatchMedia";
import { useAppState } from "../../state";
import { SuperDialogElement } from "../SuperDialogElement";

export function FindDialog({ book }: { book: types.HymnalDocument | null }) {
    let big = useMatchMedia("(min-width: 29rem)");

    let tablistRef = React.useRef<HTMLDivElement | null>(null);

    let [selectedTab, setSelectedTab] = useAppState(`app/findTab`);

    let latestTabRef = React.useRef(selectedTab);
    React.useEffect(() => {
        latestTabRef.current = selectedTab;
    });

    React.useEffect(() => {
        if (tablistRef.current !== null) {
            let tablist = tablistRef.current;
            let instance = new A11yTabs(tablist, latestTabRef.current);

            function onSelect(event: Event) {
                let tab = event.target as HTMLDivElement;
                setSelectedTab(tab.id as "index-tab" | "search-tab" | "lists-tab");
            }

            tablist.addEventListener("select", onSelect);
            return () => {
                instance.destroy();
                tablist.removeEventListener("select", onSelect);
            };
        }
    }, [setSelectedTab]);

    let [mode, setMode] = useAppState("app/mode");

    let dialogRef = React.useRef<SuperDialogElement>(null!);

    React.useEffect(() => {
        let dialog = dialogRef.current;

        function onToggle(event: Event) {
            if ((event.target as SuperDialogElement).open) setMode("find", false);
            else setMode("read");
        }

        dialog.addEventListener("toggle", onToggle);
        return () => dialog.removeEventListener("toggle", onToggle);
    });

    let dialog = (
        <super-dialog
            id="find-dialog"
            ref={dialogRef}
            open={mode === "find" ? "" : null}
            class="Dialog FindDialog"
            aria-label="find"
        >
            <div className="header">
                <button
                    className="Button"
                    data-super-dialog-close
                    aria-label="close dialog"
                >
                    {big ? <CloseIcon /> : <BackIcon />}
                </button>

                <div role="tablist" ref={tablistRef}>
                    <button role="tab" id="index-tab" data-for="index-tabpanel">
                        Index
                    </button>
                    <button role="tab" id="search-tab" data-for="search-tabpanel">
                        Search
                    </button>
                    <button role="tab" id="lists-tab" data-for="lists-tabpanel">
                        Lists
                    </button>
                </div>
            </div>

            <div
                role="tabpanel"
                id="search-tabpanel"
                aria-hidden
                aria-labelledby="search-tab"
            >
                {book ? <SearchPanel book={book} /> : <p>Loading...</p>}
            </div>

            <div
                role="tabpanel"
                id="index-tabpanel"
                aria-hidden
                aria-labelledby="index-tab"
            >
                {book ? <IndexPanel book={book} /> : <p>Loading...</p>}
            </div>

            <div
                role="tabpanel"
                id="lists-tabpanel"
                aria-hidden
                aria-labelledby="lists-tab"
            >
                <ListsPanel />
            </div>
        </super-dialog>
    );

    return ReactDOM.createPortal(dialog, document.getElementById("root")!);
}
