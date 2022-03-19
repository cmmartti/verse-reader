import React from "react";
import ReactDOM from "react-dom";
import "@github/details-dialog-element";

import { App } from "./components/App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "details-dialog": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >;
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
