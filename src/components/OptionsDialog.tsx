import React from "react";

import { useOptions } from "../options";
import { Dialog } from "./Dialog";

let fonts = [
    { name: "Raleway", value: "raleway" },
    { name: "Charter", value: "Charter, 'Times New Roman', Times, Georgia, serif" },
    {
        name: "System",
        value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    },
];

export function OptionsDialog({ toggleFullscreen }: { toggleFullscreen: () => void }) {
    let [options, setDisplayOption] = useOptions();

    return (
        <Dialog id="options-dialog" title="Settings" className="OptionsDialog">
            <div>
                Tap the header to{" "}
                <button className="ButtonLink" onClick={toggleFullscreen}>
                    toggle full screen
                </button>
                .
            </div>
            <div className="OptionsDialog-toggles">
                <ToggleButton
                    checked={options.repeatRefrain}
                    onChange={checked => setDisplayOption("repeat_refrain", checked)}
                >
                    Repeat Refrain
                </ToggleButton>
                <ToggleButton
                    checked={options.repeatChorus}
                    onChange={checked => setDisplayOption("repeat_chorus", checked)}
                >
                    Repeat Chorus
                </ToggleButton>

                <ToggleButton
                    checked={options.expandRepeatedLines}
                    onChange={checked =>
                        setDisplayOption("expand_repeated_lines", checked)
                    }
                >
                    Expand Repeated Lines
                </ToggleButton>
            </div>

            <RadioButtons
                label="Color Scheme"
                name="color-scheme"
                value={options.colorScheme}
                onChange={value =>
                    setDisplayOption(
                        "color_scheme",
                        value as "dark" | "light" | "system"
                    )
                }
                values={[
                    { name: "Auto", value: "system" },
                    { name: "Light", value: "light" },
                    { name: "Dark", value: "dark" },
                ]}
            />

            <RadioButtons
                label="Font Family"
                name="font-family"
                value={options.fontFamily}
                onChange={value => setDisplayOption("font_family", value)}
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
                    value={options.fontSize * 10}
                    onChange={e =>
                        setDisplayOption("font_size", parseInt(e.target.value, 10) / 10)
                    }
                    min="5"
                    max="17"
                    step="any"
                />
            </div>
        </Dialog>
    );
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
            <legend className="visibility-hidden">{label}</legend>
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

function c(className: string, include: boolean) {
    if (!include) return "";
    return " " + className;
}
