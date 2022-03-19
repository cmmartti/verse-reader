import * as React from "react";
import DetailsDialogElement from "@github/details-dialog-element";
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

import { HymnalDocument } from "../types";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import { useOnClickOutside } from "../util/useOnClickOutside";
import { OptionsDialog } from "./OptionsDialog";
import { SearchDialog } from "./SearchDialog";
import { MetadataPlusTitle } from "../db";

export function Toolbar({
    position,
    setPosition,
    document,
    documents,
    toggleFullscreen,
    index,
}: {
    position: string | null;
    setPosition: (position: string) => void;
    document: HymnalDocument;
    toggleFullscreen: () => void;
    documents: MetadataPlusTitle[];
    index: lunr.Index;
}) {
    let navigate = useNavigate();

    let { isPromptable, promptToInstall } = useAddToHomeScreenPrompt();

    let optionsButtonRef = React.useRef<HTMLElement>(null!);
    let optionsMenuRef = React.useRef<DetailsDialogElement>(null!);
    useOnClickOutside(
        [optionsMenuRef, optionsButtonRef],
        React.useCallback(() => {
            optionsMenuRef.current.toggle(false);
        }, [])
    );

    let searchButtonRef = React.useRef<HTMLElement>(null!);
    let searchMenuRef = React.useRef<DetailsDialogElement>(null!);
    useOnClickOutside(
        [searchMenuRef, searchButtonRef],
        React.useCallback(() => {
            searchMenuRef.current.toggle(false);
        }, [])
    );

    return (
        <div className="Toolbar">
            <div className="Toolbar-item">
                <Menu
                    transition={false}
                    menuButton={
                        <MenuButton aria-label="Menu" title="Menu" className="Button">
                            <MenuIcon />
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

            <details className="Toolbar-item Toolbar-menu">
                <summary
                    aria-label="search"
                    title="Search"
                    className="Button"
                    ref={searchButtonRef}
                >
                    <SearchIcon />
                </summary>
                <details-dialog ref={searchMenuRef}>
                    <SearchDialog document={document} index={index} />
                </details-dialog>
            </details>

            <details className="Toolbar-item Toolbar-menu">
                <summary
                    aria-label="options"
                    title="Options"
                    className="Button"
                    ref={optionsButtonRef}
                >
                    Aa
                </summary>
                <details-dialog ref={optionsMenuRef}>
                    <OptionsDialog toggleFullscreen={toggleFullscreen} />
                </details-dialog>
            </details>
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
