import React from "react";

function setScaleFactor(scaleFactor: number) {
    document.documentElement.style.setProperty(
        "--ui-scale-factor",
        scaleFactor.toFixed(1)
    );
}

function saveScaleFactor(scaleFactor: number) {
    localStorage.setItem("scale-factor", scaleFactor.toFixed(1));
}

function loadScaleFactor(): number {
    return parseFloat(localStorage.getItem("scale-factor") ?? "1");
}

const Context = React.createContext<
    [value: number, setValue: (scheme: number) => void] | undefined
>(undefined);

export function DisplayZoomProvider({children}: {children: React.ReactNode}) {
    const [displayZoom, setDisplayZoom] = React.useState(loadScaleFactor());

    React.useLayoutEffect(() => {
        saveScaleFactor(displayZoom);
        setScaleFactor(displayZoom);
    }, [displayZoom]);

    return (
        <Context.Provider value={[displayZoom, setDisplayZoom]}>
            {children}
        </Context.Provider>
    );
}

export function useDisplayZoom() {
    const context = React.useContext(Context);
    if (context === undefined) {
        throw new Error("useDisplayZoom must be within DisplayZoomProvider");
    }
    return context;
}
