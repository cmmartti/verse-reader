import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Helmet, HelmetProvider } from "react-helmet-async";

import "./styles/_index.scss";

import queryClient from "./queryClient";
import router from "./router";
import registerElements from "./elements/registerElements";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

import { ErrorBoundary } from "./components/ErrorBoundary";
import { OptionsProvider } from "./options";

registerElements();

// const root = createRoot(document.getElementById("react-root")!);
const root = createRoot(document.body);

root.render(
   <React.StrictMode>
      <ErrorBoundary>
         <QueryClientProvider client={queryClient}>
            <HelmetProvider>
               <OptionsProvider>
                  <Helmet>
                     <meta name="theme-color" content="#f4f4f4" />
                     <title>Verse Reader</title>
                  </Helmet>

                  <RouterProvider router={router} />
               </OptionsProvider>
            </HelmetProvider>
         </QueryClientProvider>
      </ErrorBoundary>
   </React.StrictMode>
);

serviceWorkerRegistration.register();
