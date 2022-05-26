import * as React from "react";

/**
 * The BeforeInstallPromptEvent is fired at the Window.onbeforeinstallprompt handler
 * before a user is prompted to "install" a web site to a home screen on mobile.
 */
interface BeforeInstallPromptEvent extends Event {
    /**
     * Returns an array of DOMString items containing the platforms on which the
     * event was dispatched. This is provided for user agents that want to present
     * a choice of versions to the user such as, for example, "web" or "play" which
     * would allow the user to chose between a web version or an Android version.
     */
    readonly platforms: string[];

    /**
     * Returns a Promise that resolves to a DOMString containing either "accepted"
     * or "dismissed".
     */
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;

    /**
     * Allows a developer to show the install prompt at a time of their own choosing.
     * This method returns a Promise.
     */
    prompt(): Promise<void>;
}

export function useAddToHomeScreenPrompt() {
    let [deferredPrompt, setDeferredPrompt] =
        React.useState<BeforeInstallPromptEvent | null>(null);

    function promptToInstall() {
        if (deferredPrompt) return deferredPrompt.prompt();
        return Promise.reject(
            new Error('Tried installing before browser sent "beforeinstallprompt" event')
        );
    }

    React.useEffect(() => {
        function promptHandler(event: BeforeInstallPromptEvent) {
            event.preventDefault();
            setDeferredPrompt(event);
        }
        window.addEventListener("beforeinstallprompt", promptHandler as any);

        return function cleanup() {
            window.removeEventListener("beforeinstallprompt", promptHandler as any);
        };
    }, []);

    return {
        isPromptable: Boolean(deferredPrompt),
        promptToInstall,
    };
}
