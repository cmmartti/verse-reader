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
    const inputRef = React.useRef<HTMLInputElement>(null!);
    const [inputValue, setInputValue] = React.useState(value ?? "");

    // React will eat "autoFocus" attributes and complain if all lowercase "autofocus"
    // is set. Bypass React's custom behaviour around autofocus by manually setting
    // it after the input is rendered.
    // The custom element DetailsDialogElement requires the "autofocus" attribute to
    // be set in order for its own autofocus functionality to work
    React.useEffect(() => {
        inputRef.current.setAttribute("autofocus", "true");
    });

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
                    ref={inputRef}
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
