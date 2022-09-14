import React from "react";
import {
    MakeGenerics,
    Outlet,
    ReactLocation,
    Router,
    useMatch,
    useNavigate,
    useSearch,
} from "@tanstack/react-location";

import * as bookService from "../bookService";
import * as types from "../types";

import { useAppState } from "../state";

import { BookIndex } from "./BookIndex";
import { BookOptions } from "./BookOptions";
import { Home } from "./Home";
import { Book } from "./Book";
import { OptionsProvider } from "../options";

const location = new ReactLocation();

export type LocationGenerics = MakeGenerics<{
    Search: {
        loc?: string;
        q?: string;
    };
}>;

export function useLoc(
    initialLoc: types.HymnId
): [types.HymnId, (loc: types.HymnId, replace: boolean) => void] {
    let search = useSearch<LocationGenerics>();
    let navigate = useNavigate();
    let match = useMatch();
    let id = match.params.id;

    let [lastLoc, setLastLoc] = useAppState(`book/${id}/lastLoc`);

    let setLoc = React.useCallback(
        (loc: string, replace: boolean) => {
            navigate({
                replace,
                search: prev => ({ ...prev, loc }),
            });
            setLastLoc(loc);
        },
        [navigate, setLastLoc]
    );

    return [(search.loc ?? lastLoc ?? initialLoc).toString(), setLoc];
}

export function App() {
    return (
        <OptionsProvider>
            <Router
                location={location}
                routes={[
                    {
                        path: "/",
                        element: <Home />,
                        loader: async () => ({
                            list: await bookService.getAllSummaries(),
                        }),
                    },
                    {
                        path: "/:id",
                        loader: async ({ params: { id } }) => ({
                            file: await bookService.getBook(id!),
                        }),
                        children: [
                            {
                                path: "/",
                                element: <Book />,
                            },
                            {
                                path: "/options",
                                element: <BookOptions />,
                            },
                            {
                                path: "/index",
                                element: <BookIndex />,
                                children: [
                                    {
                                        path: "/:groupby",
                                    },
                                ],
                            },
                        ],
                    },
                ]}
            >
                <Outlet />
            </Router>
        </OptionsProvider>
    );
}

function toggleFullscreen(element: Element) {
    if (!document.fullscreenElement)
        element.requestFullscreen({ navigationUI: "show" }).catch(err => {
            console.error(
                `Error attempting to enable fullscreen mode: ${err.message} (${err.name})`
            );
        });
    else if (document.fullscreenElement) document.exitFullscreen();
}
