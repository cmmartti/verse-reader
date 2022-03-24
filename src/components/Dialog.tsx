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
    let [instance, attributes] = useA11yDialog({ id, title: undefined });

    let [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        instance?.on("show", () => setIsOpen(true));
        instance?.on("hide", () => setIsOpen(false));
    }, [instance]);

    let windowRef = React.useRef<HTMLDivElement>(null!);

    React.useEffect(() => {
        function handleClick(event: MouseEvent) {
            let target = event.target as Element;
            if (target.closest(`[data-a11y-dialog-toggle="${id}"]`)) {
                if (isOpen) instance?.hide();
                else {
                    instance?.show();
                }
            } else if (!windowRef.current.contains(target)) {
                instance?.hide();
            }
        }
        document.addEventListener("click", handleClick);
        // document.addEventListener("mousedown", handleClick);
        return () => {
            document.removeEventListener("click", handleClick);
            // document.removeEventListener("mousedown", handleClick);
        };
    }, [id, instance, isOpen]);

    let [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => setIsMounted(true), []);
    if (!isMounted) return null;

    return ReactDOM.createPortal(
        <div {...attributes.container} className="Dialog">
            <div
                {...attributes.dialog}
                className={"Dialog-window" + (className ? " " + className : "")}
                ref={windowRef}
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
