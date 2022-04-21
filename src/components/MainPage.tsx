import React from "react";
import { getDocument, setLastPosition } from "../db";
import { useMatch, useNavigate } from "@tanstack/react-location";

import * as types from "../types";

import { AppMenu, APP_MENU_BUTTON_ID } from "./AppMenu";
import { GoToInput } from "./GoToInput";
import { FindDialog } from "./Find/FindDialog";
import { OptionsDialog } from "./OptionsDialog";
import { HorizontalScroller } from "./HorizontalScroller";

import { useDebounceCallback } from "../util/useDebounceCallback";
import { ReactComponent as MenuIcon } from "../assets/menu_book-black-24dp.svg";
import { Hymn } from "./Hymn";
import useLoader from "../util/useLoader";

export function MainPage({ list }: { list: types.Metadata[] }) {
    let navigate = useNavigate();

    let { params } = useMatch();
    let initialPosition = params.position;

    let documents = list;
    let title = documents.find(doc => doc.id === params.bookId)?.title ?? params.bookId;

    let loader = useLoader(
        React.useCallback(() => getDocument(params.bookId), [params.bookId]),
        { pendingMs: 100, pendingMinMs: 300 }
    );

    let savePosition = useDebounceCallback(
        React.useCallback(
            (newPosition: types.HymnId, replace: boolean) => {
                if (loader.ready) {
                    navigate({
                        to: `/${loader.value.id}/${newPosition}`,
                        replace,
                    });
                    setLastPosition(loader.value.id, newPosition);
                }
            },
            [loader, navigate]
        ),
        200
    );

    let [position, _setPosition] = React.useState<types.HymnId>(initialPosition);

    let latestPositionRef = React.useRef<string | null>(null);

    let setPosition = React.useCallback(
        (newPosition: types.HymnId, type: "goto" | "scroll" | "url") => {
            // Prevent repeated calls from nuking the browser history, e.g. on scroll
            if (newPosition !== latestPositionRef.current) {
                latestPositionRef.current = newPosition;
                _setPosition(newPosition);
                if (type === "goto") savePosition(newPosition, false);
                if (type === "scroll") savePosition(newPosition, true);
            }
        },
        [savePosition]
    );

    React.useLayoutEffect(() => {
        /**
         * The app updates the URL, but changing the URL should also update
         * the app. We need to distinguish these changes to avoid a feedback loop.
         * Changing the URL will not change `latestPositionRef`, so if it doesn't
         * match `initialPosition` here it means the URL was updated externally
         * (browser back button, etc.).
         */
        if (latestPositionRef.current !== initialPosition) {
            setPosition(initialPosition, "url");
        }
    }, [initialPosition, setPosition]);

    let pages = React.useMemo(
        () =>
            loader.ready
                ? Object.values(loader.value.hymns).map(hymn => ({
                      id: hymn.id,
                      children: <Hymn hymn={hymn} document={loader.value} />,
                  }))
                : [],
        [loader]
    );

    let onPageChange = React.useCallback(
        newPosition => setPosition(newPosition, "scroll"),
        [setPosition]
    );

    return (
        <main className="MainPage">
            <h1 className="MainPage-title" onClick={toggleFullscreen}>
                {title}
            </h1>

            <div className="MainPage-toolbar">
                <button className="ToolbarButton" type="button" id={APP_MENU_BUTTON_ID}>
                    <MenuIcon aria-hidden />{" "}
                    <span className="MainPage-toolbar-title">{title}</span>
                </button>

                <GoToInput
                    initialValue={position ?? ""}
                    onSubmit={React.useCallback(
                        (newPosition: types.HymnId) => setPosition(newPosition, "goto"),
                        [setPosition]
                    )}
                    maxValue={
                        loader.ready
                            ? Math.max(
                                  ...Object.keys(loader.value.hymns)
                                      .map(id => parseInt(id, 10))
                                      .sort((a, b) => a - b)
                              )
                            : undefined
                    }
                />

                <button
                    className="ToolbarButton"
                    aria-label="find"
                    title="Find"
                    type="button"
                    data-a11y-dialog-toggle="find-dialog"
                >
                    Find
                </button>

                <button
                    className="ToolbarButton"
                    aria-label="settings"
                    title="Settings"
                    data-a11y-dialog-toggle="options-dialog"
                >
                    Aa
                </button>
            </div>

            {loader.loading ? (
                <div className="MainPage-loadingScreen">
                    <p>Loading...</p>
                </div>
            ) : (
                loader.ready && (
                    <HorizontalScroller
                        pages={pages}
                        initialPage={position}
                        onPageChange={onPageChange}
                    />
                )
            )}

            <AppMenu documentId={params.bookId} documents={documents} />

            <FindDialog
                document={loader.ready ? loader.value : undefined}
                position={position}
            />

            <OptionsDialog toggleFullscreen={toggleFullscreen} />
        </main>
    );
}

function toggleFullscreen() {
    if (!document.fullscreenElement)
        document.body.requestFullscreen({ navigationUI: "show" }).catch(err => {
            console.error(
                `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
            );
        });
    else if (document.fullscreenElement) document.exitFullscreen();
}
