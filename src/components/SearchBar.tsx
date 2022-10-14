import React from "react";
import { ReactComponent as SearchOffIcon } from "../icons/close.svg";
import { ReactComponent as SearchIcon } from "../icons/search.svg";

export function SearchBar({
    value,
    onChange,
    onSubmit,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (value: string) => void;
    placeholder?: string;
}) {
    let inputRef = React.useRef<HTMLInputElement>(null!);
    return (
        <form
            style={{ paddingInline: "var(--page-padding)", paddingBlockEnd: "0.325rem"}}
            onSubmit={event => {
                event.preventDefault();
                onSubmit(value);
            }}
        >
            <div className="SearchBar">
                <SearchIcon aria-hidden />
                <input
                    ref={inputRef}
                    aria-label="search"
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    value={value}
                    onChange={event => onChange(event.target.value)}
                    placeholder={placeholder}
                    autoComplete="off"
                />
                {value.length > 0 && (
                    <button
                        type="button"
                        aria-label="clear search"
                        title="Clear Search"
                        onClick={event => {
                            event.preventDefault();
                            onChange("");
                            inputRef.current.focus();
                        }}
                        // On tap, prevent click events from firing so as to not
                        // move the focus. This prevents the keyboard from
                        // popping up or down unexpectedly.
                        onTouchEnd={event => {
                            event.preventDefault();
                            onChange("");
                        }}
                    >
                        <SearchOffIcon />
                    </button>
                )}
            </div>
        </form>
    );
}
