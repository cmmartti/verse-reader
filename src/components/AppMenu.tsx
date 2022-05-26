import React from "react";
import ReactDOM from "react-dom";

import * as types from "../types";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import A11yMenu from "../util/A11yMenu";
import { useAppState } from "../state";

function useA11yMenuInstance<E extends HTMLElement>(buttonId: string) {
    let [instance, setInstance] = React.useState<A11yMenu | null>(null);
    let [buttonElement, setButtonElement] = React.useState<HTMLButtonElement | null>(
        null
    );

    React.useEffect(() => {
        setButtonElement(document.getElementById(buttonId) as HTMLButtonElement | null);
    }, [buttonId]);

    let menuRef = React.useCallback(
        (menuElement: E) => {
            if (buttonElement === null) {
                // console.log(
                //     `[A11y-Menu] HTMLButton with id "${buttonId}" does not exist.`
                // );
                return;
            }

            if (menuElement !== null)
                setInstance(new A11yMenu(menuElement, buttonElement));
        },
        [buttonElement]
    );

    React.useEffect(() => {
        return () => {
            if (instance) instance.destroy();
        };
    }, [instance]);

    return [instance, menuRef] as const;
}

export const APP_MENU_BUTTON_ID = "app-menu-button";

export function AppMenu() {
    let [installedBooks] = useAppState("app/installedBooks");
    let [, menuRef] = useA11yMenuInstance<HTMLDivElement>(APP_MENU_BUTTON_ID);
    let { isPromptable, promptToInstall } = useAddToHomeScreenPrompt();

    return ReactDOM.createPortal(
        <div id="app-menu" role="menu" ref={menuRef} aria-hidden>
            <button
                role="menuitem"
                onClick={promptToInstall}
                aria-disabled={!isPromptable}
                accessKey="i"
            >
                <u>I</u>nstall to Home Screen
            </button>
            <button
                role="menuitem"
                accessKey="m"
                data-super-dialog-toggle="manage-dialog"
            >
                <u>M</u>anage Books...
            </button>

            {installedBooks.length > 0 && <div role="separator" />}
            {installedBooks.sort().map(bookId => (
                <Entry key={bookId} bookId={bookId} />
            ))}
        </div>,
        document.getElementById("root")!
    );
}

function Entry({ bookId }: { bookId: types.DocumentId }) {
    let [currentBookId, setCurrentBookId] = useAppState("app/currentBook");
    let [title] = useAppState(`book/${bookId}/title`);
    let isCurrent = bookId === currentBookId;
    return (
        <button
            key={bookId}
            role="menuitemradio"
            aria-checked={isCurrent}
            onClick={() => {
                if (!isCurrent) {
                    setCurrentBookId(bookId, false); // push new location to history stack
                }
            }}
        >
            {isCurrent && "✓"} {title}
        </button>
    );
}
