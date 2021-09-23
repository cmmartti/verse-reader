import React from "react";

// import {useEventListener} from "./useEventListener";

export function useFilePicker<E extends HTMLElement = HTMLElement>(
    handleFiles: (files: FileList) => void,
    fileInputProps?: React.DetailedHTMLProps<
        React.InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
    >
) {
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [isOver, _setIsOver] = React.useState(false);

    const containerRef = React.useRef<E>(null);
    // const prevValueRef = React.useRef<string>(null!);

    function setIsOver(value: boolean) {
        _setIsOver(value);
        // if (containerRef.current) {
        //     if (value) {
        //         prevValueRef.current = containerRef.current.style.pointerEvents;
        //         containerRef.current.style.pointerEvents = "none";
        //     } else {
        //         containerRef.current.style.pointerEvents = prevValueRef.current;
        //     }
        // } else {
        //     console.error("useFilePicker: innerRef has not been assigned as a ref.");
        // }
    }

    // useEventListener(containerRef, "dragenter", e => {
    //     e.stopPropagation();
    //     e.preventDefault();
    //     setIsOver(true);
    // });

    // useEventListener(containerRef, "dragleave", () => {
    //     setIsOver(false);
    // });

    // useEventListener(containerRef, "dragover", e => {
    //     e.stopPropagation();
    //     e.preventDefault();
    // });

    // useEventListener(containerRef, "drop", e => {
    //     e.stopPropagation();
    //     e.preventDefault();
    //     handleFiles(e.dataTransfer!.files);
    //     setIsOver(false);
    // });

    return {
        innerRef: containerRef,
        hiddenFileInput: (
            <input
                {...fileInputProps}
                ref={fileInputRef}
                type="file"
                style={{display: "none"}}
                onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFiles(e.target.files);
                    }
                }}
            />
        ),
        promptForFiles: () => fileInputRef.current?.click(),
        isOver,
        innerProps: {
            onDragEnter: e => {
                e.stopPropagation();
                e.preventDefault();
                setIsOver(true);
            },
            onDragLeave: () => {
                setIsOver(false);
            },
            onDragOver: e => {
                e.stopPropagation();
                e.preventDefault();
                setIsOver(true);
            },
            onDrop: e => {
                e.stopPropagation();
                e.preventDefault();
                handleFiles(e.dataTransfer.files);
                setIsOver(false);
            },
            style: {
                cursorEvents: isOver ? "none" : "",
            },
        } as React.DetailedHTMLProps<React.HTMLAttributes<E>, E>,
    };
}
