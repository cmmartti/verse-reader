import React from "react";
import ReactDOM from "react-dom";
import "./components/SuperDialogElement";
import {
    SuperDialogElement,
    ADialogElementAttributes,
} from "./components/SuperDialogElement";

import { App } from "./components/App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "super-dialog": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                SuperDialogElement
            > &
                ADialogElementAttributes & { class?: string };
        }
    }
}

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById("root")
);

serviceWorkerRegistration.register();
