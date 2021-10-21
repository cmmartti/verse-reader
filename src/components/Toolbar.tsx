import React from "react";
import {Link} from "react-router-dom";

import {DisplayOptionsDialog} from "./DisplayOptionsDialog";
import {useMatchMedia} from "../util/useMatchMedia";
import {HymnalDocument} from "../HymnalDocument";
// import {useIsInstalled} from "../util/useIsInstalled";

// import {ReactComponent as MenuIcon} from "../assets/menu-24px.svg";
import {ReactComponent as SearchIcon} from "../assets/search-24px.svg";
import {ReactComponent as CloseIcon} from "../assets/close_black_24dp.svg";
// import {ReactComponent as ArrowBackIcon} from "../assets/arrow_back_black_24dp.svg";
// import {ReactComponent as ArrowForwardIcon} from "../assets/arrow_forward_black_24dp.svg";

export function Toolbar({
    search,
    setSearch,
    page,
    setPage,
    document,
}: {
    search: string;
    setSearch: (search: string) => void;
    page: string;
    setPage: (page: string) => void;
    document: HymnalDocument;
}) {
    const isMobile = useMatchMedia("(max-width: 28rem)");
    // const isInstalled = useIsInstalled() && false;

    const searchInput = (
        <SearchInput
            initialValue={search ?? ""}
            onSubmit={value => setSearch(value)}
            className="Toolbar-grow"
            placeholder={`Search ${document.title}`}
        />
    );

    const goToInput = <GoToInput initialValue={page} onSubmit={page => setPage(page)} />;

    return (
        <div>
            <div className="Toolbar Toolbar--top">
                <Link
                    to="/"
                    aria-label="close book"
                    title="Close"
                    className="Button close"
                >
                    <CloseIcon />
                </Link>
                {/* {isInstalled && (
                    <div className="Toolbar-group">
                        <button
                            className="Button"
                            aria-label="back"
                            title="Back"
                            onClick={() => history.go(-1)}
                        >
                            <ArrowBackIcon />
                        </button>
                        <button
                            className="Button"
                            aria-label="forward"
                            title="Forward"
                            onClick={() => history.go(1)}
                        >
                            <ArrowForwardIcon />
                        </button>
                    </div>
                )} */}
                {!isMobile && searchInput}
                {!isMobile && goToInput}

                {/* <details className="details-with-Dialog">
                        <summary className="Button" aria-label="indices" title="Indices">
                            <MenuIcon />
                        </summary>
                        <details-menu role="menu" class="Dialog Dialog--bottomLeft">
                            {indices.map(index => (
                                <Link
                                    role="menuitem"
                                    onMouseEnter={event =>
                                        (event.target as HTMLButtonElement).focus()
                                    }
                                    key={index.id}
                                    to={`/${id}/${index.id}`}
                                >
                                    {index.name}
                                </Link>
                            ))}
                        </details-menu>
                    </details> */}
                <details className="details-with-Dialog">
                    <summary
                        className="Button"
                        aria-label="display options"
                        title="Display Options"
                    >
                        Aa
                    </summary>
                    <DisplayOptionsDialog />
                </details>
            </div>

            {isMobile && (
                <div className="Toolbar Toolbar--bottom">
                    {goToInput}
                    {searchInput}
                </div>
            )}
        </div>
    );
}

type SearchInputProps = {
    onSubmit: (newValue: string) => void;
    initialValue: string;
    className?: string;
    placeholder: string;
};

function SearchInput({
    onSubmit,
    initialValue,
    className,
    placeholder,
}: SearchInputProps) {
    const [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <form className={"Toolbar-group " + className}>
            <input
                type="search"
                value={value}
                onFocus={e => e.target.select()}
                onChange={event => setValue(event.target.value)}
                className="Toolbar-grow"
                placeholder={placeholder}
                aria-label="search"
            />
            <button
                type="submit"
                onClick={event => {
                    event.preventDefault();
                    onSubmit(value);
                }}
                className="Button"
                aria-label="submit search"
                title="Search"
            >
                <SearchIcon />
            </button>
        </form>
    );
}

type GoToInputProps = {
    onSubmit: (newValue: string) => void;
    initialValue: string;
    className?: string;
};

function GoToInput({onSubmit, initialValue, className}: GoToInputProps) {
    const [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <form className={"Toolbar-group " + className}>
            <input
                type="number"
                value={value}
                onFocus={e => e.target.select()}
                onChange={event => setValue(event.target.value)}
                className="Toolbar-grow"
                aria-label="page number"
            />
            <button
                type="submit"
                onClick={event => {
                    event.preventDefault();
                    onSubmit(value);
                    // (event.target as HTMLButtonElement).focus();
                }}
                className="Button"
                aria-label="go to page"
                title="Go To"
            >
                #
            </button>
        </form>
    );
}
