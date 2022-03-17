import React from "react";

// import {useEventListener} from "./useEventListener";

/**
    Example usage:

    ```
    function FilePicker() {
        let filepicker = useFilePicker<HTMLDivElement>(
            (filelist: FileList) => {
                [...filelist].forEach(async file => {
                    let fileText = await file.text();
                    processFile(fileText);
                });
            },
            {accept: "text/xml", multiple: true}
        );

        return (
            <div
                {...filepicker.innerProps}
                ref={filepicker.innerRef}
                className={"filepicker" + (filepicker.isOver ? " is-over" : "")}
            >
                <button onClick={filepicker.promptForFiles}>Select file(s) to upload</button>
                <p>Or drag and drop your files here</p>
                {filepicker.hiddenFileInput}
            </div>
        );
    }
    ```
*/
export function useFilePicker<E extends HTMLElement = HTMLElement>(
    handleFiles: (files: FileList) => void,
    fileInputProps?: React.DetailedHTMLProps<
        React.InputHTMLAttributes<HTMLInputElement>,
        HTMLInputElement
    >
) {
    let fileInputRef = React.useRef<HTMLInputElement>(null);
    let [isOver, _setIsOver] = React.useState(false);

    let containerRef = React.useRef<E>(null);
    // let prevValueRef = React.useRef<string>(null!);

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
