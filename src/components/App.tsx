import {
    ReactLocation,
    MakeGenerics,
    Router,
    Outlet,
    useMatch,
    Navigate,
} from "@tanstack/react-location";
// import { ReactLocationDevtools } from "@tanstack/react-location-devtools";

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

export function App() {
    return (
        <Router
            location={location}
            routes={[
                {
                    pendingElement: <p>Loading...</p>,
                    pendingMs: 200,
                    pendingMinMs: 500,
                    errorElement: <NotFound />,

                    loader: async () => {
                        let documentList = await getDocumentList();
                        documentList.sort((a, b) => b.lastOpened - a.lastOpened);
                        return {
                            mru:
                                documentList.sort(
                                    (a, b) => b.lastOpened - a.lastOpened
                                )[0]?.id ?? null,
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
                            loader: async () => {
                                let documentList = await getDocumentList();
                                documentList.sort((a, b) => b.lastOpened - a.lastOpened);
                                return {
                                    documents: documentList,
                                };
                            },
                        },
                        {
                            path: ":bookId",
                            loader: async match => {
                                let [metadata, document, index] = await getDocument(
                                    match.params.bookId
                                );
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
            ]}
            useErrorBoundary
        >
            <OptionsProvider>
                <Outlet />
                {/* <ReactLocationDevtools initialIsOpen={false} /> */}
            </OptionsProvider>
        </Router>
    );
}

function NavigateToMRU() {
    let { data } = useMatch<LocationGenerics>();
    if (data.mru) {
        return <Navigate to={data.mru} />;
    } else return <Navigate to="/manage" />;
}

function RedirectWithPosition() {
    let { data } = useMatch<LocationGenerics>();
    let position = data.metadata!.lastPosition || Object.keys(data.document!.hymns)[0];
    return <Navigate to={position} replace />;
}
