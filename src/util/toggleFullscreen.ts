export function toggleFullscreen(element: HTMLElement) {
    if (!document.fullscreenElement) {
        element.requestFullscreen({ navigationUI: "show" }).catch(err => {
            console.error(
                `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
            );
        });
    } else if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}
