import * as React from "react";

import { ReactComponent as MenuIcon } from "../assets/menu-24px.svg";
import { ReactComponent as SearchIcon } from "../assets/search-24px.svg";
import { ReactComponent as ArrowForwardIcon } from "../assets/arrow_forward_black_24dp.svg";

import * as types from "../types";

export function Toolbar({
    position,
    setPosition,
    document,
}: {
    position: string | null;
    setPosition: (position: string) => void;
    document: types.HymnalDocument;
}) {
    return (
        <div className="Toolbar">
            <div className="Toolbar-item">
                <button
                    className="Button"
                    aria-label="menu"
                    title="Menu"
                    type="button"
                    data-a11y-dialog-toggle="menu-dialog"
                >
                    <MenuIcon /> <h1 className="Toolbar-title">{document.year}</h1>
                </button>
            </div>
            <GoToInput
                initialValue={position ?? ""}
                onSubmit={position => setPosition(position)}
                maxValue={Math.max(
                    ...Object.keys(document.hymns)
                        .map(id => parseInt(id, 10))
                        .sort((a, b) => a - b)
                )}
            />
            <div className="Toolbar-item">
                <button
                    className="Button"
                    aria-label="search"
                    title="Search"
                    type="button"
                    data-a11y-dialog-toggle="search-dialog"
                >
                    <SearchIcon />
                </button>
            </div>
            <div className="Toolbar-item">
                <button
                    className="Button"
                    aria-label="settings"
                    title="Settings"
                    data-a11y-dialog-toggle="options-dialog"
                >
                    Aa
                </button>
            </div>
        </div>
    );
}

function GoToInput({
    onSubmit,
    initialValue,
    maxValue = 9999,
}: {
    onSubmit: (newValue: string) => void;
    initialValue: string;
    maxValue?: number;
}) {
    let [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <form
            className="Toolbar-group"
            onSubmit={event => {
                event.preventDefault();
                onSubmit(value);
            }}
        >
            <input
                type="number"
                value={value}
                onFocus={e => e.target.select()}
                onChange={event => setValue(event.target.value)}
                aria-label="page number"
                max={maxValue}
                min="1"
            />
            <button
                type="submit"
                className="Button"
                aria-label="go to page"
                title="Go To"
            >
                <ArrowForwardIcon />
            </button>
        </form>
    );
}
