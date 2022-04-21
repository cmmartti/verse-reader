import React from "react";
import ReactDOM from "react-dom";

import { useA11yDialog } from "../util/useA11yDialog";

export function Dialog({
    id,
    children,
    title,
    className = "",
}: {
    id: string;
    children?: React.ReactNode;
    title: string;
    className?: string;
}) {
    let [instance, attributes] = useA11yDialog({ id });

    let [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        instance?.on("show", () => setIsOpen(true));
        instance?.on("hide", () => setIsOpen(false));
    }, [instance]);

    let windowRef = React.useRef<HTMLDivElement>(null!);

    React.useEffect(() => {
        let handleClick = (event: MouseEvent) => {
            let target = event.target as Element;
            if (target.closest(`[data-a11y-dialog-toggle="${id}"]`)) {
                if (isOpen) instance?.hide();
                else instance?.show();
            }
        };

        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, [id, instance, isOpen]);

    React.useEffect(() => {
        let handleMousedown = (event: MouseEvent) => {
            let target = event.target as Element;
            if (
                !target.closest(`[data-a11y-dialog-toggle="${id}"]`) &&
                !target.closest(`[data-a11y-dialog-show="${id}"]`) &&
                !windowRef.current.contains(target)
            ) {
                instance?.hide();
            }
        };

        document.addEventListener("mousedown", handleMousedown);
        return () => document.removeEventListener("mousedown", handleMousedown);
    }, [id, instance]);

    let [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => setIsMounted(true), []);
    if (!isMounted) return null;

    return ReactDOM.createPortal(
        <div {...attributes.container} className="Dialog">
            <div
                {...attributes.dialog}
                className={(className ? className + " " : "") + "Dialog-content"}
                ref={windowRef}
            >
                <p {...attributes.title} style={{ display: "none" }}>
                    {title}
                </p>
                {children}
                <button {...attributes.closeButton} className="Dialog-closeButton">
                    Close dialog
                </button>
            </div>
        </div>,
        document.body
    );
}
