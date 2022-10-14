import React from "react";

/**
 * Hide loading states from the user unless they exceed a minimum of `wait` ms, and
 * once shown, display them for a minimum of `minLength` ms.
 */
export function usePending(loading: boolean, wait = 0, minLength: number = 0) {
    let [, forceRender] = React.useState<any>();

    // The buffered loading value
    let spinning = React.useRef(wait === 0 ? false : loading);
    let prevState = React.useRef(spinning.current);

    let waitTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    let minLengthTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    let recalculate = React.useCallback(() => {
        function startSpinning() {
            spinning.current = true;

            // If there is no minLength timer, abort here
            if (minLength <= 0 || minLengthTimeout.current) return;

            // Stop spinning after a minimum loading period (minLength)
            minLengthTimeout.current = setTimeout(() => {
                minLengthTimeout.current = null;
                // ...but only if `loading` has concluded during the timeout
                if (!prevState.current) {
                    spinning.current = false;
                    forceRender({});
                }
            }, minLength);
        }

        if (prevState.current) {
            // Start spinning immediately if there's no pre-spinner delay (wait)
            if (wait <= 0) startSpinning();
            // Otherwise start spinning after the pre-spinner delay timer completes
            else if (!waitTimeout.current) {
                waitTimeout.current = setTimeout(() => {
                    waitTimeout.current = null;
                    // ...but only if loading is still awaiting conclusion
                    if (prevState.current) {
                        startSpinning();
                        forceRender({});
                    }
                }, wait);
            }
        }
        // Stop spinning immediately if there is no minLength timer,
        // or if the minLength timer has already timed out.
        else if (minLength <= 0 || !minLengthTimeout.current) {
            spinning.current = false;
        }
    }, [wait, minLength]);

    let firstRun = React.useRef(true);

    // Recalculate whenever the loading state changes, or if this is the first run.
    // We want to do this synchronously with the render, not in an effect.
    // This way, when loading → true, spinning → true in the same pass.
    if (firstRun.current || loading !== prevState.current) {
        prevState.current = loading;
        recalculate();
    }

    firstRun.current = false;

    return spinning.current;
}
