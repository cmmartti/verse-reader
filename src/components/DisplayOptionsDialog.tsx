import React from "react";

import {ReactComponent as CloseIcon} from "../assets/close_black_24dp.svg";
import {useDisplayOptions} from "../context/ContextDisplayOptions";

export function DisplayOptionsDialog() {
    const [displayOptions, setDisplayOption] = useDisplayOptions();

    return (
        <details-dialog class="Dialog Dialog--bottomLeft">
            <header className="Dialog-header">
                <h3 className="Dialog-title">Display Options</h3>
                <button
                    className="Dialog-closeButton"
                    type="button"
                    data-close-dialog
                    autoFocus
                >
                    <CloseIcon />
                </button>
            </header>
            <div className="Dialog-contents">
                <div className="form-field">
                    <label className="contains-checkbox">
                        <input
                            type="checkbox"
                            checked={displayOptions.expandRepeatedLines}
                            onChange={e =>
                                setDisplayOption(
                                    "expand_repeated_lines",
                                    e.target.checked
                                )
                            }
                        />
                        Expand repeated lines
                    </label>
                </div>
                <div className="form-field">
                    <label className="contains-checkbox">
                        <input
                            type="checkbox"
                            checked={displayOptions.repeatRefrain}
                            onChange={e =>
                                setDisplayOption("repeat_refrain", e.target.checked)
                            }
                        />
                        Repeat refrain
                    </label>
                </div>
                <div className="form-field">
                    <label className="contains-checkbox">
                        <input
                            type="checkbox"
                            checked={displayOptions.repeatChorus}
                            onChange={e =>
                                setDisplayOption("repeat_chorus", e.target.checked)
                            }
                        />
                        Repeat chorus
                    </label>
                </div>
            </div>
        </details-dialog>
    );
}
