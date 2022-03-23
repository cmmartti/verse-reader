import React from "react";
import ReactDOM from "react-dom";
import { useA11yDialog } from "react-a11y-dialog";

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
    let [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => setIsMounted(true), []);

    let [, attributes] = useA11yDialog({ id, title: undefined });

    if (!isMounted) return null;

    return ReactDOM.createPortal(
        <div
            {...attributes.container}
            aria-label="Settings"
            aria-modal
            aria-hidden
            className="Dialog"
        >
            <div className="Dialog-overlay" {...attributes.overlay} />
            <div
                {...attributes.dialog}
                className={"Dialog-window" + c(className, className)}
            >
                <p {...attributes.title} className="Dialog-title">
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

let c = (className: string, include: any) => (include ? " " + className : "");
