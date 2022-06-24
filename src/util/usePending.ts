import React from "react";

export function usePending(pending: boolean, wait = 0, minLength: number = 0) {
    let [, forceRender] = React.useState<any>();

    // The buffered pending value
    let spinning = React.useRef(wait === 0 ? false : pending);
    let prevPending = React.useRef(spinning.current);

    let waitTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    let minLengthTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    let recalculate = React.useCallback(() => {
        function startSpinning() {
            spinning.current = true;

            // If there is no minLength timer, abort here
            if (minLength <= 0 || minLengthTimeout.current) return;

            // Stop spinning after a minimum pending period (minLength)
            minLengthTimeout.current = setTimeout(() => {
                minLengthTimeout.current = null;
                // ...but only if `pending` has concluded during the timeout
                if (!prevPending.current) {
                    spinning.current = false;
                    forceRender({});
                }
            }, minLength);
        }

        if (prevPending.current) {
            // Start spinning immediately if there's no pre-spinner delay (wait)
            if (wait <= 0) startSpinning();
            // Otherwise start spinning after the pre-spinner delay timer completes
            else if (!waitTimeout.current) {
                waitTimeout.current = setTimeout(() => {
                    waitTimeout.current = null;
                    // ...but only if pending is still awaiting conclusion
                    if (prevPending.current) {
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

    // Recalculate whenever the pending state changes, or if this is the first run.
    // We want to do this synchronously with the render, not in an effect.
    // This way, when pending → true, spinning → true in the same pass.
    if (firstRun.current || pending !== prevPending.current) {
        prevPending.current = pending;
        recalculate();
    }

    firstRun.current = false;

    return spinning.current;
}
