import React from "react";

import * as types from "../types";
import { APP_MENU_BUTTON_ID } from "./AppMenu";

import { ReactComponent as MenuIcon } from "../icons/menu_book.svg";
import { useAppState } from "../state";

export function Toolbar({ book }: { book: types.HymnalDocument | null }) {
    let [bookId] = useAppState("app/currentBook");
    let [title] = useAppState(`book/${bookId}/title`, book?.id ?? "Menu");
    let [loc, setLoc] = useAppState(`book/${bookId}/loc`);
    let [inputValue, setInputValue] = React.useState(loc ?? "");

    React.useEffect(() => {
        setInputValue(loc ?? "");
    }, [loc]);

    return (
        <div className="Toolbar">
            <button className="ToolbarButton" type="button" id={APP_MENU_BUTTON_ID}>
                <MenuIcon aria-hidden />{" "}
                {title && <span className="menuTitle">{title}</span>}
            </button>
            <form
                className="goto"
                onSubmit={event => {
                    event.preventDefault();
                    setLoc(inputValue, false); // push new location to history stack
                    (document.querySelector(".Book") as HTMLElement | null)?.focus();
                }}
            >
                <input
                    type="number"
                    value={inputValue}
                    onFocus={e => e.target.select()}
                    onChange={event => setInputValue(event.target.value)}
                    aria-label="page number"
                    max={
                        book === null
                            ? undefined
                            : Math.max(
                                  ...Object.keys(book.hymns)
                                      .map(id => parseInt(id, 10))
                                      .sort((a, b) => a - b)
                              )
                    }
                    min="1"
                    placeholder="#"
                />
            </form>
            <button
                className="ToolbarButton"
                type="button"
                data-super-dialog-toggle="find-dialog"
            >
                Find
            </button>
            <button
                className="ToolbarButton"
                aria-label="settings"
                title="Settings"
                data-super-dialog-toggle="options-dialog"
            >
                Aa
            </button>
        </div>
    );
}
