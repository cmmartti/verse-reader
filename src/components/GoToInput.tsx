import React from "react";

import { ReactComponent as ArrowForwardIcon } from "../assets/arrow_forward_black_24dp.svg";

export function GoToInput({
    onSubmit,
    initialValue,
    maxValue = 9999,
}: {
    onSubmit: (newValue: string) => void;
    initialValue: string;
    maxValue?: number;
}) {
    let [value, setValue] = React.useState(initialValue);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <form
            className="GoToInput"
            onSubmit={event => {
                event.preventDefault();
                onSubmit(value);
            }}
        >
            <input
                type="number"
                value={value}
                onFocus={e => e.target.select()}
                onChange={event => setValue(event.target.value)}
                aria-label="page number"
                max={maxValue}
                min="1"
            />
            <button
                type="submit"
                aria-label="go to page"
                title="Go To"
                className="ToolbarButton"
            >
                <ArrowForwardIcon />
            </button>
        </form>
    );
}
