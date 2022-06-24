import React from "react";

import DialogElement from "../elements/DialogElement";
import { ReactComponent as BackIcon } from "../icons/arrow_back.svg";
import { ReactComponent as SearchOffIcon } from "../icons/search_off.svg";
import { mergeRefs } from "../util/megeRefs";

export type Index = {
    type: string;
    name: string;
    hasDefaultSort?: boolean;
};

export let FindDialogBase = React.forwardRef<
    DialogElement,
    {
        open?: boolean;
        onToggle?: (open: boolean) => void;

        allIndexes?: Index[];
        initialIndex?: Index | null;
        onIndexChange?: (type: Index | null) => void;

        search?: string;
        onSearchChange?: (search: string) => void;
        onSearchSubmit?: (search: string) => void;

        children?: React.ReactNode;
    }
>((props, outerRef) => {
    let {
        open = false,
        onToggle,
        allIndexes = [],
        initialIndex = null,
        onIndexChange,
        search = "",
        onSearchChange,
        onSearchSubmit,
        children = null,
    } = props;

    let [currentIndex, _setCurrentIndex] = React.useState(initialIndex);
    function setCurrentIndex(type: Index | null) {
        _setCurrentIndex(type);
        onIndexChange?.(type);
    }

    let wellRef = React.useRef<HTMLDivElement>(null!);
    let inputRef = React.useRef<HTMLInputElement>(null!);

    let dialogRef = React.useRef<DialogElement>(null!);
    React.useEffect(() => {
        let handler = (event: Event) => {
            if (typeof onToggle === "function")
                onToggle((event.target as DialogElement).open);
        };

        let dialog = dialogRef.current;
        dialog.addEventListener("super-dialog-toggle", handler);
        return () => dialog.removeEventListener("super-dialog-toggle", handler);
    });

    return (
        <super-dialog
            id="find-dialog"
            ref={mergeRefs([outerRef, dialogRef])}
            open={open ? "" : null}
            class="FindDialog"
            aria-label="find"
        >
            <div className="row">
                <button
                    className="Button"
                    onClick={() => dialogRef.current.toggle(false)}
                    aria-label="close dialog"
                >
                    <BackIcon aria-hidden />
                </button>

                <select
                    className="expand"
                    style={{ fontWeight: "bold" }}
                    aria-label="index"
                    title="Index"
                    value={currentIndex?.type ?? "_none"}
                    onChange={event => {
                        setCurrentIndex(
                            allIndexes.find(
                                index => index.type === event.target.value
                            ) ?? null
                        );
                    }}
                >
                    <option value="_none">All Hymns</option>
                    {allIndexes.map(index => (
                        <option key={index.type} value={index.type}>
                            {index.name}
                        </option>
                    ))}
                </select>
            </div>

            <form
                className="row"
                onSubmit={event => {
                    event.preventDefault();
                    onSearchSubmit?.(search);
                }}
            >
                <input
                    ref={inputRef}
                    className="expand"
                    aria-label="search"
                    type="search"
                    value={search}
                    onChange={event => onSearchChange?.(event.target.value)}
                    placeholder="Search"
                    // onFocus={e => e.target.select()}
                    autoComplete="off"
                    autoFocus
                />
                <button
                    type="button"
                    className="Button"
                    aria-label="clear search"
                    title="Clear Search"
                    disabled={search.length === 0}
                    onClick={event => {
                        event?.preventDefault();
                        onSearchChange?.("");
                        inputRef.current.focus();
                    }}
                    // On touch input, don't move the focus when tapping the clear button.
                    // This is to prevent the keyboard from popping up or down unexpectedly
                    onTouchEnd={event => {
                        event.preventDefault();
                        onSearchChange?.("");
                    }}
                >
                    <SearchOffIcon />
                </button>
            </form>

            <div
                className="content"
                tabIndex={-1}
                ref={wellRef}
                // Set a key so that the content area (and thus scroll position)
                // is not re-used across indices
                key={currentIndex?.type ?? "_none"}
            >
                {children}
            </div>
        </super-dialog>
    );
});
