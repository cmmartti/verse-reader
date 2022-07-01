import React from "react";

import DialogElement from "../elements/DialogElement";
import { useMatchMedia } from "../util/useMatchMedia";
import { ReactComponent as CloseIcon } from "../icons/close.svg";

export function Sidebar({
    open,
    onClose,
    title,
    children,
    button = "",
    overlayOnMobile = false,
}: {
    open: boolean;
    onClose?: () => void;
    title: string;
    children: React.ReactNode;
    button?: string;
    overlayOnMobile?: boolean;
}) {
    let sidebarRef = React.useRef<DialogElement>(null!);

    let mobileMode = useMatchMedia("(max-width: 29rem)");

    React.useEffect(() => {
        function handler(event: Event) {
            let target = event.target as Element | null;
            if (
                mobileMode &&
                overlayOnMobile &&
                sidebarRef.current &&
                !sidebarRef.current.contains(target)
            ) {
                if (sidebarRef.current.open && !target?.closest(button))
                    sidebarRef.current.toggle(false);
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileMode, overlayOnMobile, button]);

    React.useEffect(() => {
        let sidebar = sidebarRef.current;
        if (!sidebar) return;

        let handler = () => {
            if (typeof onClose === "function" && !sidebar.open) {
                onClose();
            }
        };

        if (sidebar.open) sidebar.addEventListener("super-dialog-toggle", handler);

        return () => {
            sidebar.removeEventListener("super-dialog-toggle", handler);
        };
    }, [onClose]);

    return (
        <super-dialog
            class={"Sidebar" + (overlayOnMobile ? " overlay" : "")}
            ref={sidebarRef}
            open={open ? "" : null}
            aria-labelledby="sidebar-title"
        >
            <header className="Sidebar-titlebar">
                <h2 id="sidebar-title">{title}</h2>
                <button
                    className="Button"
                    onClick={() => sidebarRef.current.toggle(false)}
                    aria-label="close dialog"
                    title="Close Sidebar"
                >
                    <CloseIcon aria-hidden />
                </button>
            </header>
            <div className="Sidebar-content">{children}</div>
        </super-dialog>
    );
}
