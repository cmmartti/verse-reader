import React from "react";
import ReactDOM from "react-dom";

import c from "../util/c";
import { useAppState } from "../state";
import { useMatchMedia } from "../util/useMatchMedia";
import { SuperDialogElement } from "./SuperDialogElement";

const fonts = [
    { name: "Raleway", value: "raleway" },
    { name: "Charter", value: "Charter, 'Times New Roman', Times, Georgia, serif" },
    {
        name: "System",
        value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    },
];

const ROOT = document.documentElement;

export function OptionsDialog() {
    let [repeatRefrain, setRepeatRefrain] = useAppState("hymn/repeatRefrain");
    let [repeatChorus, setRepeatChorus] = useAppState("hymn/repeatChorus");
    let [expandRepeatedLines, setExpandRepeatedLines] = useAppState(
        "hymn/expandRepeatedLines"
    );

    let [colorScheme, setColorScheme] = useAppState("app/colorScheme");
    let systemColorScheme = useMatchMedia("(prefers-color-scheme: dark)")
        ? ("dark" as const)
        : ("light" as const);
    React.useLayoutEffect(() => {
        ROOT.setAttribute(
            "data-color-scheme",
            colorScheme === "system" ? systemColorScheme : colorScheme
        );
    }, [colorScheme, systemColorScheme]);

    let [fontSize, setFontSize] = useAppState("app/fontSize");
    React.useLayoutEffect(() => {
        ROOT.style.setProperty("--ui-scale-factor", fontSize.toString());
    }, [fontSize]);

    let [fontFamily, setFontFamily] = useAppState("app/fontFamily");
    React.useLayoutEffect(() => {
        ROOT.style.setProperty("--font-family", fontFamily);
    }, [fontFamily]);

    let [mode, setMode] = useAppState("app/mode");

    let dialogRef = React.useRef<SuperDialogElement>(null!);

    React.useEffect(() => {
        let dialog = dialogRef.current;

        function onToggle(event: Event) {
            if ((event.target as SuperDialogElement).open) setMode("options", false);
            else setMode("read");
        }

        dialog.addEventListener("toggle", onToggle);
        return () => dialog.removeEventListener("toggle", onToggle);
    });

    let dialog = (
        <super-dialog
            ref={dialogRef}
            open={mode === "options" ? "" : null}
            class="Dialog OptionsDialog"
            id="options-dialog"
            aria-label="settings"
        >
            <div className="OptionsDialog-toggles">
                <ToggleButton
                    checked={repeatRefrain}
                    onChange={checked => setRepeatRefrain(checked)}
                >
                    Repeat Refrain
                </ToggleButton>
                <ToggleButton
                    checked={repeatChorus}
                    onChange={checked => setRepeatChorus(checked)}
                >
                    Repeat Chorus
                </ToggleButton>

                <ToggleButton
                    checked={expandRepeatedLines}
                    onChange={checked => setExpandRepeatedLines(checked)}
                >
                    Expand Repeated Lines
                </ToggleButton>
            </div>

            <RadioButtons
                label="Color Scheme"
                name="color-scheme"
                value={colorScheme}
                onChange={value => setColorScheme(value as "light" | "dark" | "system")}
                values={[
                    { name: "Auto", value: "system" },
                    { name: "Light", value: "light" },
                    { name: "Dark", value: "dark" },
                ]}
            />

            <RadioButtons
                label="Font Family"
                name="font-family"
                value={fontFamily}
                onChange={value => setFontFamily(value)}
                values={fonts.map(({ name, value }) => ({
                    name: <span style={{ fontFamily: value }}>{name}</span>,
                    value,
                }))}
            />

            <div className="OptionsDialog-range">
                <input
                    aria-label="font size"
                    title="Font Size"
                    type="range"
                    value={fontSize * 10}
                    onChange={e => setFontSize(parseInt(e.target.value, 10) / 10)}
                    // onChange={e =>
                    //     setDisplayOption("font_size", parseInt(e.target.value, 10) / 10)
                    // }
                    min="5"
                    max="20"
                    step="any"
                />
            </div>

            <button data-super-dialog-close className="Dialog-closeButton">
                Close dialog
            </button>
        </super-dialog>
    );

    return ReactDOM.createPortal(dialog, document.getElementById("root")!);
}

function toggleFullscreen() {
    if (!document.fullscreenElement)
        document.body.requestFullscreen({ navigationUI: "show" }).catch(err => {
            console.error(
                `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
            );
        });
    else if (document.fullscreenElement) document.exitFullscreen();
}

function ToggleButton({
    checked,
    onChange,
    children,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <label className={"ToggleButton" + c("ToggleButton--checked", checked)}>
            <input
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            {children}
        </label>
    );
}

function RadioButtons({
    label,
    values,
    value,
    onChange,
    name,
}: {
    label: string;
    values: { name: React.ReactNode; value: string }[];
    value: string;
    onChange: (value: string) => void;
    name: string;
}) {
    return (
        <fieldset className="RadioButtons" title={label}>
            <legend style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
                {label}
            </legend>
            {values.map(({ name: buttonText, value: buttonValue }) => (
                <label
                    key={buttonValue}
                    className={
                        "RadioButtons-button" +
                        c("RadioButtons-button--checked", value === buttonValue)
                    }
                >
                    <input
                        type="radio"
                        name={name}
                        checked={value === buttonValue}
                        onChange={e => {
                            if (e.target.checked) onChange(buttonValue);
                        }}
                    />
                    {buttonText}
                </label>
            ))}
        </fieldset>
    );
}
