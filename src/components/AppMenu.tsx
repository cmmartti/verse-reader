import React from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "@tanstack/react-location";

import * as types from "../types";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import { useMatchMedia } from "../util/useMatchMedia";
import A11yMenu from "../util/A11yMenu";

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

export function AppMenu({
    documentId,
    documents,
}: {
    documentId: types.DocumentId;
    documents: types.Metadata[];
}) {
    let navigate = useNavigate();

    let [, menuRef] = useA11yMenuInstance<HTMLDivElement>(APP_MENU_BUTTON_ID);

    let { isPromptable, promptToInstall } = useAddToHomeScreenPrompt();

    let toolbarOnBottom = useMatchMedia("(max-width: 29rem)");

    let installButton = (
        <button
            role="menuitem"
            onClick={promptToInstall}
            aria-disabled={!isPromptable}
            accessKey="i"
        >
            <u>I</u>nstall to Home Screen
        </button>
    );
    let manageLink = (
        <button
            role="menuitem"
            onClick={() => navigate({ to: "/manage" })}
            accessKey="m"
        >
            <u>M</u>anage Books...
        </button>
    );
    let documentList = (
        <div role="group">
            {/* {documents.map(d => (
                <Link
                    key={d.id}
                    to={"/" + d.id}
                    role="menuitemradio"
                    aria-checked={d.id === documentId}
                >
                    {d.id === documentId && "✓"} {d.title}
                </Link>
            ))} */}
            {documents.map(d => (
                <button
                    key={d.id}
                    role="menuitemradio"
                    aria-checked={d.id === documentId}
                    onClick={() => {
                        if (documentId !== d.id) navigate({ to: "/" + d.id });
                        console.log("/" + d.id);
                    }}
                >
                    {d.id === documentId && "✓"} {d.title}
                </button>
            ))}
        </div>
    );
    let separator = <div role="separator"></div>;

    let menu = (
        <div id="app-menu" role="menu" ref={menuRef} aria-hidden>
            {toolbarOnBottom ? (
                <>
                    {installButton}
                    {manageLink}
                    {separator}
                    {documentList}
                </>
            ) : (
                <>
                    {documentList}
                    {separator}
                    {manageLink}
                    {installButton}
                </>
            )}
        </div>
    );

    return ReactDOM.createPortal(menu, document.body);
}
