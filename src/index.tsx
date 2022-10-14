import React from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.scss";
import { App } from "./components/App";
import { registerElements } from "./elements/registerElements";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { ErrorBoundary } from "./components/ErrorBoundary";

const container = document.getElementById("root");
const root = createRoot(container!);

registerElements();

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </React.StrictMode>
);

serviceWorkerRegistration.register();
