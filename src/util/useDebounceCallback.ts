import React from "react";

export function useDebounceCallback<CallbackArgs extends any[]>(
    callback: (...args: CallbackArgs) => void,
    wait = 100,
    leading = false
): (...args: CallbackArgs) => void {
    const storedCallback = useLatest(callback);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

    // Clean up pending timeouts when the deps change
    React.useEffect(
        () => () => {
            timeoutRef.current && clearTimeout(timeoutRef.current);
            timeoutRef.current = void 0;
        },
        [wait, leading, storedCallback]
    );

    return React.useCallback(
        function () {
            const args = arguments;
            const {current} = timeoutRef;

            // Calls on leading edge
            if (current === void 0 && leading) {
                timeoutRef.current = setTimeout(() => {
                    timeoutRef.current = void 0;
                }, wait);
                return storedCallback.current.apply(null, args as any);
            }

            // Clear the timeout every call and start waiting again
            current && clearTimeout(current);

            // Wait before invoking the callback
            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = void 0;
                storedCallback.current.apply(null, args as any);
            }, wait);
        },
        [wait, leading, storedCallback]
    );
}

function useLatest<T extends any>(current: T) {
    const storedValue = React.useRef(current);
    React.useEffect(() => {
        storedValue.current = current;
    });
    return storedValue;
}
