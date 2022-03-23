import React from "react";
import { setLastPosition } from "../db";
import { useMatch, useNavigate } from "@tanstack/react-location";

import { Toolbar } from "./Toolbar";
import { Document } from "./Document";

import { HymnId } from "../types";
import { toggleFullscreen as _toggleFullscreen } from "../util/toggleFullscreen";
import { LocationGenerics } from "./App";
import { useDebounceCallback } from "../util/useDebounceCallback";
import { OptionsDialog } from "./OptionsDialog";
import { SearchDialog } from "./SearchDialog";

export function MainPage() {
    let {
        data,
        params: { position: initialPosition },
    } = useMatch<LocationGenerics>();
    let document = data.document!;
    let index = data.index!;
    let documents = data.documents!;

    let ref = React.useRef<HTMLDivElement>(null!);

    let { position, setPosition, shouldScroll } = usePosition(
        initialPosition,
        document.id
    );

    let toggleFullscreen = React.useCallback(() => _toggleFullscreen(ref.current), []);

    return (
        <main className="MainPage" ref={ref}>
            <h1 className="MainPage-title" onClick={toggleFullscreen}>
                {document.title}
            </h1>

            <Toolbar
                position={position}
                setPosition={React.useCallback(
                    (newPosition: HymnId) => setPosition(newPosition, "goto"),
                    [setPosition]
                )}
                document={document}
                documents={documents}
            />
            <Document
                shouldScroll={shouldScroll}
                position={position}
                setPosition={React.useCallback(
                    newPosition => setPosition(newPosition, "scroll"),
                    [setPosition]
                )}
                document={document}
            />
            <OptionsDialog toggleFullscreen={toggleFullscreen} />
            <SearchDialog document={document} index={index} />
        </main>
    );
}

function usePosition(initialPosition: HymnId, documentId: string) {
    let navigate = useNavigate();

    let savePosition = useDebounceCallback(
        React.useCallback(
            (newPosition: HymnId, replace: boolean) => {
                navigate({ to: `/${documentId}/${newPosition}`, replace });
                setLastPosition(documentId, newPosition);
            },
            [documentId, navigate]
        ),
        200
    );

    let [shouldScroll, setShouldScroll] = React.useState(false);
    let [position, _setPosition] = React.useState<HymnId>(initialPosition);

    let latestPositionRef = React.useRef<string | null>(null);

    let setPosition = React.useCallback(
        (newPosition: HymnId, type: "goto" | "scroll" | "url") => {
            // Don't let repeat calls destroy the browser history,
            // e.g. when the position is updated on scroll
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
        /**
         * The app should update the URL, but changing the URL should also update
         * the app. We need to distinguish these changes to avoid a feedback loop.
         * Changing the URL will not change `latestPositionRef`, so if it doesn't
         * match `initialPosition` here it means the URL was updated externally
         * (browser back button, etc.).
         */
        if (latestPositionRef.current !== initialPosition) {
            setPosition(initialPosition, "url");
        }
    }, [initialPosition, setPosition]);

    return { position, setPosition, shouldScroll };
}

// import { useCSSVar } from "../util/useCSSVar";
// import { useViewportWidth } from "../util/useViewportWidth";

// const HYMN_WIDTH_PREFERRED = 560;
// const HYMN_HEIGHT_PREFERRED = 500;

// let [viewportWidth, viewportHeight] = useViewportWidth(ref, HYMN_WIDTH_PREFERRED);
// let mobileMode =
//     viewportHeight < HYMN_HEIGHT_PREFERRED || viewportWidth < HYMN_WIDTH_PREFERRED;
// useCSSVar("--scroll-snap-type", mobileMode ? "x mandatory" : "none");
