import React from "react";
import create from "zustand";

let useStore = create<Record<string, unknown>>(() => ({}));
let useCache = <T>(key: string) => useStore(state => state[key]) as T | undefined;
let setCache = <T>(key: string, value: T) => useStore.setState(() => ({ [key]: value }));

/**
 * Not intended for network requests. Has no error management. Yet.
 */
export function useLoader<T>(opts: {
    key: string;
    loader: () => Promise<T>;
    pendingMs?: number;
    pendingMinMs?: number;
}) {
    let { key, loader, pendingMs = 0, pendingMinMs = 0 } = opts;

    let value = useCache<T>(key);
    let [mode, setMode] = React.useState<"idle" | "loading" | "success">("idle");

    React.useEffect(() => {
        let pendingTimeout: NodeJS.Timeout | undefined;
        let pendingMinTimeout: NodeJS.Timeout | undefined;
        let heldValue: T | undefined;

        if (!pendingMs) setMode("loading");
        else {
            if (pendingMs > 0) setMode("idle");
            pendingTimeout = setTimeout(() => {
                setMode("loading");
                if (pendingMinMs) {
                    pendingMinTimeout = setTimeout(() => {
                        pendingMinTimeout = undefined;
                        setMode("success");
                        if (heldValue !== undefined) {
                            setCache(key, heldValue);
                        }
                    }, pendingMinMs);
                }
            }, pendingMs);
        }

        loader().then(value => {
            if (pendingTimeout) {
                clearTimeout(pendingTimeout);
                pendingTimeout = undefined;
            }
            if (!pendingMinTimeout) {
                setMode("success");
                setCache(key, value);
            } else heldValue = value;
        });

        return () => {
            if (pendingTimeout) clearTimeout(pendingTimeout);
            if (pendingMinTimeout) clearTimeout(pendingMinTimeout);
        };
    }, [key, loader, pendingMs, pendingMinMs]);

    if (mode === "success") {
        if (value === undefined) return { mode: "idle" as const, value: undefined };
        return { mode: "success" as const, value };
    }
    if (mode === "loading") return { mode: "loading" as const, value: undefined };
    return { mode: "idle" as const, value: undefined };
}
