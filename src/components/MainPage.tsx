import React from "react";
import { setLastPosition } from "../db";
import { useMatch, useNavigate } from "@tanstack/react-location";

import { Toolbar } from "./Toolbar";
import { Document } from "./Document";

import { toggleFullscreen as _toggleFullscreen } from "../util/toggleFullscreen";
import { useDebounceCallback } from "../util/useDebounceCallback";
import { LocationGenerics } from "./App";

export function MainPage() {
    let {
        data,
        params: { position: initPosition },
    } = useMatch<LocationGenerics>();
    let document = data.document!;

    let ref = React.useRef<HTMLDivElement>(null!);

    let [position, setPosition, shouldScroll] = usePosition(initPosition, document.id);

    let toggleFullscreen = React.useCallback(() => _toggleFullscreen(ref.current), []);

    return (
        <main className="MainPage" ref={ref}>
            <h1 className="MainPage-title" onClick={toggleFullscreen}>
                {document.title}
            </h1>
            <Toolbar
                position={position}
                setPosition={React.useCallback(
                    (newPosition: string) => setPosition(newPosition, "goto"),
                    [setPosition]
                )}
                document={document}
                index={data.index!}
                documents={data.documents!}
                toggleFullscreen={toggleFullscreen}
            />
            <Document
                parentRef={ref}
                shouldScroll={shouldScroll}
                position={position}
                setPosition={React.useCallback(
                    newPosition => setPosition(newPosition, "scroll"),
                    [setPosition]
                )}
                document={document}
            />
        </main>
    );
}

function usePosition(initialPosition: string, documentId: string) {
    let navigate = useNavigate();

    let savePosition = useDebounceCallback(
        React.useCallback(
            (newPosition: string, replace: boolean) => {
                navigate({ to: `/${documentId}/${newPosition}`, replace });
                setLastPosition(documentId, newPosition);
            },
            [documentId, navigate]
        ),
        200
    );

    let [shouldScroll, setShouldScroll] = React.useState(false);
    let [position, _setPosition] = React.useState<string>(initialPosition);

    /**
     * The app should update the URL, but changing the URL should also update
     * the app. We need to distinguish these changes to avoid a feedback loop.
     * Changing the URL will not change `latestPositionRef`, so if this value ever
     * gets out of sync with `position` it means the URL was updated externally.
     * (browser back button, etc.).
     */
    let latestPositionRef = React.useRef<string | null>(null);

    let setPosition = React.useCallback(
        (newPosition: string, type: "goto" | "scroll" | "url") => {
            // Don't let repeat calls destroy the history,
            // e.g. when the position is updated on scroll
            // Use `latestPositionRef` instead of `position`
            // to avoid changing the function identity.
            if (newPosition !== latestPositionRef.current) {
                _setPosition(newPosition);

                switch (type) {
                    case "goto":
                        savePosition(newPosition, true);
                        setShouldScroll(true);
                        break;
                    case "scroll":
                        savePosition(newPosition, false);
                        setShouldScroll(false);
                        break;
                    case "url":
                        setShouldScroll(true);
                        break;
                }

                latestPositionRef.current = newPosition;
            }
        },
        [savePosition]
    );

    React.useLayoutEffect(() => {
        if (latestPositionRef.current !== initialPosition) {
            setPosition(initialPosition, "url");
        }
    }, [initialPosition, setPosition]);

    return [position, setPosition, shouldScroll] as const;
}
