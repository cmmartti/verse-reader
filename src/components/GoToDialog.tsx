import React from "react";
import DetailsDialogElement from "@github/details-dialog-element";

import {ReactComponent as CloseIcon} from "../assets/close_black_24dp.svg";

export function GoToDialog({
    goTo,
    value,
}: {
    goTo: (pageId: string) => void;
    value: string | null;
}) {
    const dialogRef = React.useRef<DetailsDialogElement>(null!);
    const [inputValue, setInputValue] = React.useState(value ?? "");

    return (
        <details-dialog ref={dialogRef} class="Dialog Dialog--bottomRight">
            <header className="Dialog-header">
                <h3 className="Dialog-title">Go To</h3>
                <button type="button" data-close-dialog className="Dialog-closeButton">
                    <CloseIcon />
                </button>
            </header>
            <form
                className="Dialog-contents"
                onSubmit={event => {
                    event.preventDefault();
                    if (inputValue) {
                        goTo(inputValue);
                        dialogRef.current.toggle(false);
                    }
                }}
            >
                <input
                    // React thinks autoFocus is the only correct capitalization, but
                    // DetailsDialogElement requires autofocus to be all lower-case.
                    // @ts-ignore
                    autofocus=""
                    type="number"
                    value={inputValue}
                    onChange={event => setInputValue(event.target.value)}
                />
                <div>
                    <button className="Button" type="submit" aria-disabled={!inputValue}>
                        Go
                    </button>
                </div>
            </form>
        </details-dialog>
    );
}
