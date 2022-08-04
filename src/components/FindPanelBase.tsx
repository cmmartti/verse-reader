import React from "react";

import { ReactComponent as SearchOffIcon } from "../icons/close.svg";
import { ReactComponent as SearchIcon } from "../icons/search.svg";
import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { ReactComponent as BackIcon } from "../icons/arrow_back.svg";
import DialogElement from "../elements/DialogElement";

export type Index = {
    type: string;
    name: string;
    hasDefaultSort?: boolean;
};

export let FindPanelBase = (props: {
    open: boolean;
    onClose?: () => void;

    allIndexes?: Index[];
    initialIndex?: Index | null;
    onIndexChange?: (type: Index | null) => void;

    search?: string;
    onSearchChange?: (search: string) => void;
    onSearchSubmit?: (search: string) => void;

    expandAll?: () => void;
    collapseAll?: () => void;
    sort?: string;
    setSort?: (sort: string) => void;

    children?: React.ReactNode;
}) => {
    let {
        open,
        onClose,
        allIndexes = [],
        initialIndex = null,
        onIndexChange,
        search = "",
        onSearchChange,
        onSearchSubmit,
        children = null,
        expandAll,
        collapseAll,
        sort,
        setSort,
    } = props;

    let [currentIndex, _setCurrentIndex] = React.useState(initialIndex);
    function setCurrentIndex(type: Index | null) {
        _setCurrentIndex(type);
        onIndexChange?.(type);
    }

    let inputRef = React.useRef<HTMLInputElement>(null!);
    let resultsRef = React.useRef<HTMLDivElement>(null!);

    let sidebarRef = React.useRef<DialogElement>(null!);

    React.useEffect(() => {
        let sidebar = sidebarRef.current;
        if (!sidebar) return;

        let fn = () => {
            if (typeof onClose === "function" && !sidebar.open) onClose();
        };
        if (sidebar.open) sidebar.addEventListener("super-dialog-toggle", fn);
        return () => sidebar.removeEventListener("super-dialog-toggle", fn);
    }, [onClose]);

    return (
        <super-dialog
            class="FindPanel"
            ref={sidebarRef}
            open={open ? "" : null}
            aria-label="Index"
        >
            <div className="FindPanel-toolbar">
                <button
                    aria-label="close dialog"
                    className="Button"
                    onClick={() => sidebarRef.current.toggle(false)}
                >
                    <BackIcon aria-hidden />
                </button>
                <select
                    aria-label="index"
                    title="Index"
                    value={currentIndex?.type}
                    onChange={event => {
                        setCurrentIndex(
                            allIndexes.find(
                                index => index.type === event.target.value
                            ) ?? null
                        );
                    }}
                >
                    {allIndexes.map(index => (
                        <option key={index.type} value={index.type}>
                            {index.name}
                        </option>
                    ))}
                </select>

                <super-menu-button for="find-menu">
                    <MoreIcon />
                </super-menu-button>

                <super-menu id="find-menu">
                    <button role="menuitem" onClick={() => expandAll?.()}>
                        Expand All
                    </button>
                    <button role="menuitem" onClick={() => collapseAll?.()}>
                        Collapse All
                    </button>
                    <div role="separator" />
                    <button
                        role="menuitemradio"
                        onClick={() => setSort?.("default")}
                        aria-checked={sort === "default"}
                    >
                        {sort === "default" && "✓"} Default Sort
                    </button>
                    <button
                        role="menuitemradio"
                        onClick={() => setSort?.("a-z")}
                        aria-checked={sort === "a-z"}
                    >
                        {sort === "a-z" && "✓"} Sort Alphabetically
                    </button>
                    <button
                        role="menuitemradio"
                        onClick={() => setSort?.("count")}
                        aria-checked={sort === "count"}
                    >
                        {sort === "count" && "✓"} Sort By Count
                    </button>
                </super-menu>
            </div>

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

            <form
                className="FindPanel-toolbar"
                onSubmit={event => {
                    event.preventDefault();
                    resultsRef.current.focus();
                    onSearchSubmit?.(search);
                }}
            >
                <div className="FindPanel-search">
                    <input
                        ref={inputRef}
                        aria-label="search"
                        type="search"
                        value={search}
                        onChange={event => {
                            resultsRef.current.scrollTo({ top: 0 });
                            onSearchChange?.(event.target.value);
                        }}
                        placeholder="Search..."
                        // onFocus={e => e.target.select()}
                        autoComplete="off"
                    />
                    {search.length > 0 && (
                        <button
                            type="button"
                            aria-label="clear search"
                            title="Clear Search"
                            onClick={event => {
                                event?.preventDefault();
                                onSearchChange?.("");
                                inputRef.current.focus();
                            }}
                            // On tap, prevent click events from firing so as to not
                            // move the focus. This is to prevent the keyboard from
                            // popping up or down unexpectedly.
                            onTouchEnd={event => {
                                event.preventDefault();
                                onSearchChange?.("");
                            }}
                        >
                            <SearchOffIcon />
                        </button>
                    )}
                </div>
                <button type="submit" className="Button">
                    <SearchIcon aria-hidden />
                    <span className="visually-hidden">Search</span>
                </button>
            </form>
        </super-dialog>
    );
};
