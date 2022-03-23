import * as React from "react";
import {
    Menu,
    MenuItem,
    MenuButton,
    MenuDivider,
    MenuRadioGroup,
} from "@szhsin/react-menu";
import { useNavigate } from "@tanstack/react-location";

import { ReactComponent as MenuIcon } from "../assets/menu-24px.svg";
import { ReactComponent as SearchIcon } from "../assets/search-24px.svg";
import { ReactComponent as ArrowForwardIcon } from "../assets/arrow_forward_black_24dp.svg";

import * as types from "../types";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";

export function Toolbar({
    position,
    setPosition,
    document,
    documents,
}: {
    position: string | null;
    setPosition: (position: string) => void;
    document: types.HymnalDocument;
    documents: types.Metadata[];
}) {
    let navigate = useNavigate();

    let { isPromptable, promptToInstall } = useAddToHomeScreenPrompt();

    return (
        <div className="Toolbar">
            <div className="Toolbar-item">
                <Menu
                    transition={false}
                    menuButton={
                        <MenuButton aria-label="Menu" title="Menu" className="Button">
                            <MenuIcon />{" "}
                            <h1 className="Toolbar-title">{document.title}</h1>
                        </MenuButton>
                    }
                >
                    <MenuItem disabled={!isPromptable} onClick={() => promptToInstall()}>
                        Install to Home Screen
                    </MenuItem>
                    <MenuItem
                        href="/"
                        onClick={e => {
                            e.syntheticEvent.preventDefault();
                            navigate({ to: "/manage" });
                        }}
                    >
                        Manage Books…
                    </MenuItem>
                    {documents.length > 1 && (
                        <>
                            <MenuDivider />
                            <MenuRadioGroup value={document.id}>
                                {documents.map(({ id, title }) => (
                                    <MenuItem
                                        key={id}
                                        value={id}
                                        href={"/" + id}
                                        onClick={e => {
                                            e.syntheticEvent.preventDefault();
                                            navigate({ to: "/" + id });
                                        }}
                                    >
                                        {title}
                                    </MenuItem>
                                ))}
                            </MenuRadioGroup>
                        </>
                    )}
                </Menu>
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
                    data-a11y-dialog-show="search-dialog"
                >
                    <SearchIcon />
                </button>
            </div>
            <div className="Toolbar-item">
                <button
                    className="Button"
                    aria-label="settings"
                    title="Settings"
                    type="button"
                    data-a11y-dialog-show="options-dialog"
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
                // (event.target as HTMLButtonElement).focus();
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
