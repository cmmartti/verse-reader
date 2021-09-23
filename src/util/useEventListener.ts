import React from "react";

export const useEventListener = <T extends keyof WindowEventMap>(
    element: React.RefObject<Element> | Document | Window,
    type: T,
    listener: (e: WindowEventMap[T]) => void,
    options?: AddEventListenerOptions
) => {
    const savedListener = React.useRef<(e: WindowEventMap[T]) => void>();

    React.useEffect(() => {
        savedListener.current = listener;
    }, [listener]);

    // const handleEvent = React.useCallback((event: WindowEventMap[T]) => {
    //     savedListener.current?.(event);
    // }, []);
    //
    // React.useEffect(() => {
    //     const target = getRefElement(element);
    //     target?.addEventListener(type, handleEvent, options);
    //     return () => target?.removeEventListener(type, handleEvent);
    // }, [type, element, options, handleEvent]);
};

export const getRefElement = <T>(element?: React.RefObject<Element> | T) => {
    if (element && "current" in element) {
        return element.current;
    }

    return element;
};
