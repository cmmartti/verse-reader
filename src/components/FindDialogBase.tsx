import React from "react";

import { ReactComponent as SearchOffIcon } from "../icons/search_off.svg";
import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { ReactComponent as CloseIcon } from "../icons/arrow_back.svg";

export type Index = {
    type: string;
    name: string;
    hasDefaultSort?: boolean;
};

export let FindDialogBase = (props: {
    allIndexes?: Index[];
    initialIndex?: Index | null;
    onIndexChange?: (type: Index | null) => void;

    search?: string;
    onSearchChange?: (search: string) => void;
    onSearchSubmit?: (search: string) => void;

    children?: React.ReactNode;
}) => {
    let {
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

    let inputRef = React.useRef<HTMLInputElement>(null!);
    let resultsRef = React.useRef<HTMLDivElement>(null!);

    return (
        <div className="FindPanel">
            <div className="FindPanel-toolbar">
                {/* <button className="Button">
                    <CloseIcon />
                </button> */}
                <select
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
                <super-menu-button for="find-menu" class="Button">
                    <MoreIcon />
                </super-menu-button>
            </div>

            <super-menu id="find-menu">
                <button role="menuitem">Expand All</button>
                <button role="menuitem">Collapse All</button>
                <div role="separator" />
                <button role="menuitemradio" aria-checked={true}>
                    ✓ Default Sort
                </button>
                <button role="menuitemradio" aria-checked={false}>
                    Sort Alphabetically
                </button>
                <button role="menuitemradio" aria-checked={false}>
                    Sort By Count
                </button>
            </super-menu>

            <form
                className="FindPanel-search"
                onSubmit={event => {
                    event.preventDefault();
                    resultsRef.current.focus();
                    onSearchSubmit?.(search);
                }}
            >
                <input
                    ref={inputRef}
                    aria-label="search"
                    type="search"
                    value={search}
                    onChange={event => {
                        resultsRef.current.scrollTo({ top: 0 });
                        onSearchChange?.(event.target.value);
                    }}
                    placeholder="Search"
                    // onFocus={e => e.target.select()}
                    autoComplete="off"
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
                className="FindPanel-results"
                tabIndex={-1}
                ref={resultsRef}
                // Set a key so that the content area (and thus scroll position)
                // is not re-used across indices
                key={currentIndex?.type ?? "_none"}
            >
                {children}
            </div>
        </div>
    );
};
