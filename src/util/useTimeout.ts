import { useEffect, useCallback, useRef } from "react";

/**
 * React hook for delaying calls with time. Returns callback to use for cancelling.
 * https://js.plainenglish.io/usetimeout-react-hook-3cc58b94af1f
 *
 * @param callback function to call. No args passed. If you create a new callback each render, then previous callback will be cancelled on render.
 * @param timeout delay, ms (default: immediately put into JS Event Queue)
 */
export default function useTimeout(callback: () => void, timeout: number = 0) {
    let timeoutIdRef = useRef<NodeJS.Timeout>();

    let cancel = useCallback(() => {
        let timeoutId = timeoutIdRef.current;
        if (timeoutId) {
            timeoutIdRef.current = undefined;
            clearTimeout(timeoutId);
        }
    }, [timeoutIdRef]);

    useEffect(() => {
        timeoutIdRef.current = setTimeout(callback, timeout);
        return cancel;
    }, [callback, timeout, cancel]);

    return cancel;
}
