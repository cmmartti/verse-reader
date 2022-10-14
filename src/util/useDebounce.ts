import React from "react";

/**
 * This hook allows you to debounce any fast changing value. The debounced value
 * will only reflect the latest value when the useDebounce hook has not been called
 * for the specified time period. When used in conjunction with useEffect, you can
 * easily ensure that expensive operations like API calls are not executed too frequently.
 *
 * https://usehooks.com/useDebounce/
 *
 * @param value The value to be debounced
 * @param delay milliseconds between updates
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        // Update debounced value after delay
        const handler = setTimeout(() => setDebouncedValue(value), delay);

        // Cancel the timeout if value changes (also on delay change or unmount).
        // This is how we prevent debounced value from updating if value is
        // changed within the delay period. Timeout gets cleared and restarted.
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}
