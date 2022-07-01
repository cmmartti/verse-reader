import React from "react";

import c from "../util/c";
import { useAppState } from "../state";

const fonts = [
    { name: "Raleway", value: "raleway" },
    { name: "Charter", value: "Charter, 'Times New Roman', Times, Georgia, serif" },
    {
        name: "System",
        value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    },
];

export let OptionsDialog = () => {
    let [repeatRefrain, setRepeatRefrain] = useAppState("hymn/repeatRefrain");
    let [repeatChorus, setRepeatChorus] = useAppState("hymn/repeatChorus");
    let [expandRepeated, setExpandRepeated] = useAppState("hymn/expandRepeatedLines");
    let [colorScheme, setColorScheme] = useAppState("app/colorScheme");
    let [fontSize, setFontSize] = useAppState("app/fontSize");
    let [fontFamily, setFontFamily] = useAppState("app/fontFamily");

    return (
        <div className="OptionsDialog">
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
                    checked={expandRepeated}
                    onChange={checked => setExpandRepeated(checked)}
                >
                    Expand Repeated Lines
                </ToggleButton>
            </div>

            <RadioButtons
                label="Color Scheme"
                name="color-scheme"
                value={colorScheme}
                onChange={value =>
                    setColorScheme(value as "sepia" | "light" | "dark" | "system")
                }
                values={[
                    { name: "Auto", value: "system" },
                    { name: "White", value: "light" },
                    { name: "Sepia", value: "sepia" },
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
                    min="5"
                    max="20"
                    step="any"
                />
            </div>
        </div>
    );
};

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
            <legend className="visually-hidden">{label}</legend>
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
