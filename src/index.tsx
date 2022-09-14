import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "react-query";

import "./styles/index.scss";
import { App } from "./components/App";
import { registerElements } from "./elements/registerElements";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            retry: false,
            refetchOnWindowFocus: false,
        },
    },
});

const container = document.getElementById("root");
const root = createRoot(container!);

registerElements();

root.render(
    <React.StrictMode>
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        </ErrorBoundary>
    </React.StrictMode>
);

serviceWorkerRegistration.register();
