import React from "react";

export function toggleFullscreen(elementRef: React.MutableRefObject<HTMLElement>) {
    if (!document.fullscreenElement) {
        elementRef.current.requestFullscreen({ navigationUI: "show" }).catch(err => {
            console.error(
                `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
            );
        });
    } else if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}