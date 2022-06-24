import React from "react";

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
    let [isOver, setIsOver] = React.useState(false);

    let containerRef = React.useRef<E>(null);

    return {
        innerRef: containerRef,
        hiddenFileInput: (
            <input
                {...fileInputProps}
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
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
            onDragEnter: event => {
                event.preventDefault();
                setIsOver(true);
            },
            onDragLeave: () => {
                setIsOver(false);
            },
            onDragOver: event => {
                event.preventDefault();
                setIsOver(true);
            },
            onDrop: event => {
                event.preventDefault();
                setIsOver(false);
                handleFiles(event.dataTransfer.files);
            },
            style: {
                cursorEvents: isOver ? "none" : "",
            },
        } as React.DetailedHTMLProps<React.HTMLAttributes<E>, E>,
    };
}
