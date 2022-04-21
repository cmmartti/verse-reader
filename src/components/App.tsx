import React from "react";
import { ReactLocation, Router, useMatch, Navigate } from "@tanstack/react-location";

import { ManagePage } from "./ManagePage";
import { MainPage } from "./MainPage";
import { OptionsProvider } from "../options";
import { getDocumentList, setLastOpened } from "../db";
import * as types from "../types";

import { useViewportHeight } from "../util/useViewportWidth";
import { useCSSVar } from "../util/useCSSVar";
import useLoader from "../util/useLoader";

import "./index.scss";

const location = new ReactLocation();

export function App() {
    let viewportHeight = useViewportHeight();
    useCSSVar("--vh100", viewportHeight + "px");

    let listLoader = useLoader(getDocumentList, {pendingMs: 100, pendingMinMs: 300 });

    return (
        <OptionsProvider>
            {listLoader.loading && <p>Loading...</p>}
            {listLoader.ready && (
                <Router
                    location={location}
                    useErrorBoundary
                    routes={[
                        {
                            path: "/",
                            element: <NavigateToMRU list={listLoader.value} />,
                        },
                        {
                            path: "manage",
                            element: <ManagePage list={listLoader.value} />,
                        },
                        {
                            path: ":bookId/",
                            element: <RedirectWithPosition list={listLoader.value} />,
                        },
                        {
                            path: ":bookId/:position",
                            element: <MainPage list={listLoader.value} />,
                            onMatch: match => {
                                setLastOpened(match.params.bookId, Date.now());
                            },
                        },
                    ]}
                />
            )}
        </OptionsProvider>
    );
}

function NavigateToMRU({ list }: { list: types.Metadata[] }) {
    // Find most-recently-used document
    let mru = list.sort((a, b) => b.lastOpened - a.lastOpened)[0]?.id;
    if (mru) return <Navigate to={mru} />;
    return <Navigate to="/manage" />;
}

function RedirectWithPosition({ list }: { list: types.Metadata[] }) {
    let { params } = useMatch();

    return (
        <Navigate
            to={list.find(doc => doc.id === params.bookId)?.lastPosition ?? "1"}
            replace
        />
    );
}
