import React from "react";

export function useDebouncedCallback<CallbackArgs extends any[]>(
    callback: (...args: CallbackArgs) => void,
    wait = 100,
    leading = false
): (...args: CallbackArgs) => void {
    let storedCallback = useLatestRef(callback);
    let timeout = React.useRef<ReturnType<typeof setTimeout>>();

    return React.useCallback(
        (...args) => {
            // Call on leading edge
            if (timeout.current === undefined && leading) {
                timeout.current = setTimeout(() => {
                    timeout.current = undefined;
                }, wait);
                return storedCallback.current(...args);
            }

            // Clear the timeout every call and start waiting again
            if (timeout.current) clearTimeout(timeout.current);

            // Wait until the timeout has completed before invoking the callback
            timeout.current = setTimeout(() => {
                timeout.current = undefined;
                storedCallback.current(...args);
            }, wait);

            // Clean up pending timeouts when the dependencies change
            return () => {
                timeout.current && clearTimeout(timeout.current);
                timeout.current = undefined;
            };
        },
        [wait, leading, storedCallback]
    );
}

function useLatestRef<T extends any>(current: T) {
    let storedValue = React.useRef(current);
    React.useEffect(() => {
        storedValue.current = current;
    });
    return storedValue;
}
