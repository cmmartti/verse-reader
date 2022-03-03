import * as React from "react";
import {
    Menu,
    MenuItem,
    MenuButton,
    MenuDivider,
    MenuRadioGroup,
} from "@szhsin/react-menu";
import { useNavigate } from "react-router-dom";

// import { DetailsDialog } from "./DetailsDialog";
import { useDisplayOptions } from "../util/useDisplayOptions";
import { ReactComponent as MenuIcon } from "../assets/menu-24px.svg";
import { ReactComponent as SearchIcon } from "../assets/search-24px.svg";
import { ReactComponent as ArrowForwardIcon } from "../assets/arrow_forward_black_24dp.svg";
import { HymnalDocument, Verse as VerseType } from "../types";
// import { DisplayOptionsDialog } from "./DisplayOptionsDialog";
import { getDocuments } from "../util/documentRepository";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import { useOnClickOutside } from "../util/useOnClickOutside";
import DetailsDialogElement from "@github/details-dialog-element";

const c = (className: string, include: boolean) => (include ? " " + className : "");

export function Toolbar({
    page,
    setPage,
    document,
}: {
    page: string | null;
    setPage: (page: string) => void;
    document: HymnalDocument;
}) {
    const navigate = useNavigate();
    const metadata = getDocuments();

    const { isPromptable, promptToInstall } = useAddToHomeScreenPrompt();

    const optionsButtonRef = React.useRef<HTMLElement>(null!);
    const optionsMenuRef = React.useRef<DetailsDialogElement>(null!);
    useOnClickOutside(
        [optionsMenuRef, optionsButtonRef],
        React.useCallback(() => {
            optionsMenuRef.current.toggle(false);
        }, [])
    );

    const searchButtonRef = React.useRef<HTMLElement>(null!);
    const searchMenuRef = React.useRef<DetailsDialogElement>(null!);
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
                    // position="initial"
                    // reposition="initial"
                    menuButton={
                        <MenuButton aria-label="Books" title="Books">
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
                            navigate("/manage");
                        }}
                    >
                        Manage Books…
                    </MenuItem>
                    {metadata.length > 1 && (
                        <>
                            <MenuDivider />
                            <MenuRadioGroup value={document.id}>
                                {metadata.map(book => (
                                    <MenuItem
                                        key={book.id}
                                        value={book.id}
                                        href={"/" + book.id}
                                        onClick={e => {
                                            e.syntheticEvent.preventDefault();
                                            navigate("/" + book.id);
                                        }}
                                    >
                                        {book.title}
                                    </MenuItem>
                                ))}
                            </MenuRadioGroup>
                        </>
                    )}
                </Menu>
            </div>
            <GoToInput
                initialValue={page ?? ""}
                onSubmit={page => setPage(page)}
                maxValue={Math.max(
                    ...Object.keys(document.hymns)
                        .map(id => parseInt(id, 10))
                        .sort((a, b) => a - b)
                )}
            />
            {/* <div className="Toolbar-item">
                <button disabled>
                    <SearchIcon />
                </button>
            </div> */}

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
                    <SearchDialog document={document} />
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
                    <OptionsDialog />
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
    const [value, setValue] = React.useState(initialValue);

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

function SearchDialog({ document }: { document: HymnalDocument }) {
    const [inputValue, setInputValue] = React.useState("");
    const hymnResults = filterHymns(document, inputValue);

    return (
        <div className="SearchDialog">
            <div className="SearchDialog-controls">
                <input
                    autoFocus
                    type="search"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
            </div>
            <div className="SearchDialog-results">
                <p>
                    {hymnResults.length} result{hymnResults.length !== 1 && "s"}
                </p>
                <ul className="SearchDialog-hymnList">
                    {hymnResults.map(result => {
                        return (
                            <li key={result.id}>
                                <div>
                                    {result.id}: {document.hymns[result.id].title}
                                </div>
                                {inputValue && (
                                    <ul>
                                        {result.matches.map((match, i) => (
                                            <li key={i}>{match}</li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

type HymnResult = {
    id: string;
    matches: string[];
};

function filterHymns(document: HymnalDocument, search: string) {
    const results: HymnResult[] = [];
    const lowerCasedSearch = search.toLowerCase();
    for (const hymn of Object.values(document.hymns)) {
        const matches: Array<string | string[]> = [];
        for (const verse of hymn.verses) {
            matches.push(searchVerse(verse, lowerCasedSearch));
        }
        if (hymn.refrain) {
            matches.push(searchVerse(hymn.refrain, search));
        }
        if (hymn.chorus) {
            matches.push(searchVerse(hymn.chorus, search));
        }
        const flatMatches = matches.flat();
        if (flatMatches.length > 0) {
            results.push({ id: hymn.id, matches: flatMatches });
        }
    }

    return results;
}

function searchVerse(verse: VerseType, lowerCasedSearch: string) {
    const matches: string[] = [];
    for (const lineOrRepeat of verse.lines) {
        if (lineOrRepeat.kind === "line") {
            if (lineOrRepeat.text.toLowerCase().includes(lowerCasedSearch))
                matches.push(lineOrRepeat.text);
        } else if (lineOrRepeat.kind === "repeat") {
            for (const line of lineOrRepeat.lines) {
                if (line.text.toLowerCase().includes(lowerCasedSearch))
                    matches.push(line.text);
            }
        }
    }
    return matches;
}

function OptionsDialog() {
    const [options, setDisplayOption] = useDisplayOptions();

    return (
        <div className="OptionsDialog">
            <div className="OptionsDialog-toggles">
                <ToggleButton
                    checked={options.expandRepeatedLines}
                    onChange={checked =>
                        setDisplayOption("expand_repeated_lines", checked)
                    }
                >
                    Expand Repeats <b>:,:</b>
                </ToggleButton>
                <ToggleButton
                    checked={options.hideDeletedLines}
                    onChange={checked => setDisplayOption("hide_deleted_lines", checked)}
                >
                    Hide Deleted
                </ToggleButton>
                <ToggleButton
                    checked={options.repeatRefrain}
                    onChange={checked => setDisplayOption("repeat_refrain", checked)}
                >
                    Repeat Refrain
                </ToggleButton>
                <ToggleButton
                    checked={options.repeatChorus}
                    onChange={checked => setDisplayOption("repeat_chorus", checked)}
                >
                    Repeat Chorus
                </ToggleButton>
            </div>

            <RadioButtons
                label="Color Scheme"
                name="color-scheme"
                value={options.colorScheme}
                onChange={value =>
                    setDisplayOption(
                        "color_scheme",
                        value as "dark" | "light" | "system"
                    )
                }
                values={[
                    ["Light", "light"],
                    ["Dark", "dark"],
                    ["Auto", "system"],
                ]}
            />

            <RadioButtons
                label="Font Family"
                name="font-family"
                value={options.fontFamily}
                onChange={value => setDisplayOption("font_family", value)}
                values={[
                    ["Charter", "Charter, 'Times New Roman', Times, Georgia, serif"],
                    [
                        "System",
                        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
                    ],
                    ["Raleway", "raleway"],
                ]}
            />

            <div className="OptionsDialog-range">
                <input
                    aria-label="font size"
                    title="Font Size"
                    type="range"
                    value={options.fontSize * 10}
                    onChange={e =>
                        setDisplayOption("font_size", parseInt(e.target.value, 10) / 10)
                    }
                    min="5"
                    max="15"
                />
            </div>
        </div>
    );
}

function ToggleButton({
    checked,
    onChange,
    children,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <label className={"ToggleButton" + c("ToggleButton--checked", checked)}>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            {children}
        </label>
    );
}

function RadioButtons({
    label,
    values,
    value,
    onChange,
    name,
}: {
    label: string;
    values: [name: string, value: string][];
    value: string;
    onChange: (value: string) => void;
    name: string;
}) {
    return (
        <fieldset className="RadioButtons" title={label}>
            <legend className="visibility-hidden">{label}</legend>
            {values.map(([buttonText, buttonValue]) => (
                <label
                    key={buttonValue}
                    className={
                        "RadioButtons-button" +
                        c("RadioButtons-button--checked", value === buttonValue)
                    }
                >
                    <input
                        type="radio"
                        name={name}
                        checked={value === buttonValue}
                        onChange={e => {
                            if (e.target.checked) onChange(buttonValue);
                        }}
                    />
                    {buttonText}
                </label>
            ))}
        </fieldset>
    );
}
