import React from "react";

import { useAppState } from "../state";
import DialogElement from "../elements/DialogElement";
import { ReactComponent as CloseIcon } from "../icons/close.svg";
import { fonts } from "../fonts";
import { useMatchMedia } from "../util/useMatchMedia";

export function OptionsPanel({
    open,
    onClose,
}: {
    open: boolean;
    onClose?: () => void;
}) {
    let htmlId = React.useId();

    let [repeatRefrain, setRepeatRefrain] = useAppState("hymn/repeatRefrain");
    let [repeatChorus, setRepeatChorus] = useAppState("hymn/repeatChorus");
    let [expandRepeated, setExpandRepeated] = useAppState("hymn/expandRepeatedLines");
    let [colorScheme, setColorScheme] = useAppState("app/colorScheme");
    let [fontSize, setFontSize] = useAppState("app/fontSize");
    let [fontFamily, setFontFamily] = useAppState("app/fontFamily");

    let sidebarRef = React.useRef<DialogElement>(null!);

    React.useEffect(() => {
        let sidebar = sidebarRef.current;
        if (!sidebar) return;

        let fn = () => {
            if (typeof onClose === "function" && !sidebar.open) onClose();
        };
        if (sidebar.open) sidebar.addEventListener("super-dialog-toggle", fn);
        return () => sidebar.removeEventListener("super-dialog-toggle", fn);
    }, [onClose]);

    let isOverlay = useMatchMedia("(max-width: 29rem)");

    React.useEffect(() => {
        let fn = (event: MouseEvent) => {
            let target = event.target as Element | null;
            if (
                isOverlay &&
                sidebarRef.current &&
                !sidebarRef.current.contains(target)
            ) {
                if (sidebarRef.current.open) {
                    sidebarRef.current.toggle(false);
                    event.preventDefault();
                }
            }
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, [isOverlay]);

    return (
        <super-dialog
            class="OptionsPanel"
            ref={sidebarRef}
            open={open ? "" : null}
            aria-labelledby="sidebar-title"
        >
            <header className="OptionsPanel-titlebar">
                <h2 id="sidebar-title">Appearance</h2>
                <button
                    className="Button"
                    onClick={() => sidebarRef.current.toggle(false)}
                    aria-label="close dialog"
                    title="Close Sidebar"
                >
                    <CloseIcon aria-hidden />
                </button>
            </header>
            <div className="OptionsPanel-contents">
                <label className="ToggleButton">
                    <input
                        type="checkbox"
                        checked={repeatRefrain}
                        onChange={e => setRepeatRefrain(e.target.checked)}
                    />
                    Repeat Refrain
                </label>
                <label className="ToggleButton">
                    <input
                        type="checkbox"
                        checked={repeatChorus}
                        onChange={e => setRepeatChorus(e.target.checked)}
                    />
                    Repeat Chorus
                </label>
                <label className="ToggleButton">
                    <input
                        type="checkbox"
                        checked={expandRepeated}
                        onChange={e => setExpandRepeated(e.target.checked)}
                    />
                    Expand Repeated Lines
                </label>
                <label className="ToggleButton">
                    <input
                        type="checkbox"
                        checked={colorScheme === "black"}
                        onChange={e =>
                            setColorScheme(e.target.checked ? "black" : "light")
                        }
                    />
                    Dark Mode
                </label>

                <div className="Select">
                    <label htmlFor={htmlId + "-fontFamily"}>Font Family</label>
                    <select
                        id={htmlId + "-fontFamily"}
                        value={fontFamily}
                        onChange={e => setFontFamily(e.target.value)}
                    >
                        {fonts.map(({ name, id, value }) => (
                            <option key={id} value={id} style={{ fontFamily: value }}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="OptionsPanel-range">
                    <label htmlFor={htmlId + "-fontSize"}>Font Size</label>
                    <input
                        type="range"
                        value={fontSize * 10}
                        onChange={e => setFontSize(parseInt(e.target.value, 10) / 10)}
                        min="10"
                        max="20"
                        step="1"
                    />
                </div>
            </div>
        </super-dialog>
    );
}
