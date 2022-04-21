import React from "react";

export default function useLoader<T>(
    loader: () => Promise<T>,
    opts: { pendingMs?: number; pendingMinMs?: number } = {}
) {
    let { pendingMs = 0, pendingMinMs = 0 } = opts;

    type State =
        | { loading: false; ready: false }
        | { loading: true; ready: false }
        | { loading: false; ready: true; value: T };

    type Action = ["reset"] | ["pending"] | ["ready", T];

    let [state, dispatch] = React.useReducer(
        (state: State, [type, value]: Action) => {
            switch (type) {
                // case "reset":
                //     return { loading: false as const, ready: false as const };
                case "pending":
                    return { loading: true as const, ready: false as const };
                case "ready":
                    return { loading: false as const, ready: true as const, value };
                default:
                    return state;
            }
        },
        { loading: false, ready: false }
    );

    React.useEffect(() => {
        let pendingTimeout: NodeJS.Timeout | undefined;
        let pendingMinTimeout: NodeJS.Timeout | undefined;
        let heldValue: T | undefined;

        if (!pendingMs) dispatch(["pending"]);
        else
            pendingTimeout = setTimeout(() => {
                dispatch(["pending"]);
                if (pendingMinMs) {
                    pendingMinTimeout = setTimeout(() => {
                        pendingMinTimeout = undefined;
                        if (heldValue) dispatch(["ready", heldValue]);
                    }, pendingMinMs);
                }
            }, pendingMs);

        loader().then(value => {
            if (pendingTimeout) {
                clearTimeout(pendingTimeout);
                pendingTimeout = undefined;
            }
            if (!pendingMinTimeout) dispatch(["ready", value]);
            else heldValue = value;
        });

        return () => {
            if (pendingTimeout) clearTimeout(pendingTimeout);
            if (pendingMinTimeout) clearTimeout(pendingMinTimeout);
        };
    }, [loader, pendingMs, pendingMinMs]);

    return state;
}
