import React from "react";

export function useDebounceCallback<CallbackArgs extends any[]>(
    callback: (...args: CallbackArgs) => void,
    wait = 100,
    leading = false
): (...args: CallbackArgs) => void {
    const storedCallback = useLatestRef(callback);
    const timeout = React.useRef<ReturnType<typeof setTimeout>>();

    return React.useCallback(
        (...args) => {
            // Call on leading edge
            if (timeout.current === void 0 && leading) {
                timeout.current = setTimeout(() => {
                    timeout.current = void 0;
                }, wait);
                return storedCallback.current(...args);
            }

            // Clear the timeout every call and start waiting again
            if (timeout.current) clearTimeout(timeout.current);

            // Wait until the timeout has completed before invoking the callback
            timeout.current = setTimeout(() => {
                timeout.current = void 0;
                storedCallback.current(...args);
            }, wait);

            // Clean up pending timeouts when the deps change
            return () => {
                timeout.current && clearTimeout(timeout.current);
                timeout.current = void 0;
            };
        },
        [wait, leading, storedCallback]
    );
}

function useLatestRef<T extends any>(current: T) {
    const storedValue = React.useRef(current);
    React.useEffect(() => {
        storedValue.current = current;
    });
    return storedValue;
}