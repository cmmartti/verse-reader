import React from "react";
import { setLastPosition } from "../db";
import { useMatch, useNavigate } from "@tanstack/react-location";

import { Toolbar } from "./Toolbar";
import { Document } from "./Document";

import { toggleFullscreen as _toggleFullscreen } from "../util/toggleFullscreen";
import { useDebounceCallback } from "../util/useDebounceCallback";
import { LocationGenerics } from "./App";

export function MainPage() {
    let { data, params } = useMatch<LocationGenerics>();
    let document = data.document!;
    let metadata = data.metadata!;

    let initialPosition = React.useMemo(() => {
        if (params.position && params.position in document.hymns) {
            return params.position;
        }
        if (metadata.lastPosition && metadata.lastPosition in document.hymns) {
            return metadata.lastPosition;
        }
        return Object.keys(document.hymns)[0];
    }, [metadata, document, params.position]);

    let ref = React.useRef<HTMLDivElement>(null!);

    let navigate = useNavigate();

    let savePosition = useDebounceCallback(
        React.useCallback(
            (newPosition: string, replace: true | false = false) => {
                navigate({ to: `/${document.id}/${newPosition}`, replace });
                setLastPosition(document.id, newPosition);
            },
            [document.id, navigate]
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
        (
            newPosition: string,
            opt: { save?: "replace" | false | "push"; scroll?: boolean }
        ) => {
            let { save = false, scroll = false } = opt;

            // Don't let repeat calls destroy the history,
            // e.g. when the position is updated on scroll at (*) below.
            // Use `latestPositionRef` instead of `position` to avoid changing
            // function identity.
            if (newPosition !== latestPositionRef.current) {
                _setPosition(newPosition);
                if (save) savePosition(newPosition, save === "replace");
                if (scroll) setShouldScroll(true);
                else setShouldScroll(false);
                latestPositionRef.current = newPosition;
            }
        },
        [savePosition]
    );

    React.useLayoutEffect(() => {
        if (latestPositionRef.current !== initialPosition) {
            setPosition(initialPosition, { scroll: true });
        }
    }, [initialPosition, setPosition]);

    let toggleFullscreen = React.useCallback(() => _toggleFullscreen(ref.current), []);

    return (
        <main className="MainPage" ref={ref}>
            <h1 className="MainPage-title" onClick={toggleFullscreen}>
                {document.title}
            </h1>
            <Toolbar
                position={position}
                setPosition={React.useCallback(
                    (position: string) => {
                        setPosition(position, { save: "push", scroll: true });
                    },
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
                    position => {
                        setPosition(position, { save: "replace" }); // (*)
                    },
                    [setPosition]
                )}
                document={document}
            />
        </main>
    );
}
