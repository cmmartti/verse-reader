import * as React from "react";
import "@github/details-dialog-element";
import {
    MakeGenerics,
    Outlet,
    ReactLocation,
    Router,
    useMatch,
    Route,
    Navigate,
} from "@tanstack/react-location";

import { ManagePage } from "./ManagePage";
import { MainPage } from "./MainPage";
import { NotFound } from "./NotFound";
import { OptionsProvider } from "../options";
import {
    getDocument,
    getDocumentList,
    Metadata,
    MetadataPlusTitle,
    setLastOpened,
} from "../db";
import { HymnalDocument } from "../types";

import "./App.scss";

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

export type LocationGenerics = MakeGenerics<{
    LoaderData: {
        documents: MetadataPlusTitle[];
        document: HymnalDocument;
        metadata: Metadata;
        index: lunr.Index;
        mru: string | null; // most-recently-used
    };
}>;

const location = new ReactLocation();

let routes: Route[] = [
    {
        pendingElement: <p>Loading...</p>,
        pendingMs: 200,
        pendingMinMs: 500,
        errorElement: <NotFound />,

        loader: async () => {
            let documentList = await getDocumentList();
            documentList.sort((a, b) => b.lastOpened - a.lastOpened);
            return {
                mru: documentList.sort((a, b) => b.lastOpened - a.lastOpened)[0].id,
                documents: documentList,
            };
        },

        children: [
            {
                path: "/",
                element: <NavigateToMRU />,
            },
            {
                path: "manage",
                element: <ManagePage />,
            },
            {
                path: ":bookId",
                loader: async ({ params: { bookId } }) => {
                    let [metadata, document, index] = await getDocument(bookId);
                    return { metadata, document, index };
                },

                children: [
                    {
                        path: "/",
                        element: <RedirectWithPosition />,
                    },
                    {
                        path: ":position",
                        element: <MainPage />,
                        onMatch: match => {
                            setLastOpened(match.params.bookId, Date.now());
                        },
                    },
                ],
            },
        ],
    },
];

export function App() {
    return (
        <OptionsProvider>
            <Router
                location={location}
                routes={routes}
                useErrorBoundary
            >
                <Outlet />
            </Router>
        </OptionsProvider>
    );
}

function NavigateToMRU() {
    const { data } = useMatch<LocationGenerics>();
    if (data.mru) {
        return <Navigate to={data.mru} />;
    }
    return <NotFound />;
}

function RedirectWithPosition() {
    let { data } = useMatch<LocationGenerics>();
    return <Navigate to={data.metadata!.lastPosition} replace />;
}
