import React from "react";
import {BrowserRouter, Switch, Route} from "react-router-dom";

import {PageHome} from "./pages/PageHome";
import {PageDocument} from "./pages/PageDocument";

import {ColorSchemeProvider} from "./util/useColorScheme";
import {BookProvider} from "./context/ContextBook";
import {DocumentLocationProvider} from "./context/ContextDocumentLocation";
import {DisplayOptionsProvider} from "./context/ContextDisplayOptions";
import {DisplayZoomProvider} from "./util/useDisplayZoom";

import "./styles/index.scss";

import "@github/details-dialog-element";
import "@github/details-menu-element";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "details-dialog": any;
            "details-menu": any;
        }
    }
}

export default function App() {
    return (
        <BrowserRouter>
            <DisplayZoomProvider>
                <ColorSchemeProvider>
                    <BookProvider>
                        <DocumentLocationProvider>
                            <Switch>
                                <Route
                                    path="/:id"
                                    render={({match}) => (
                                        <DisplayOptionsProvider id={match.params.id}>
                                            <PageDocument id={match.params.id} />
                                        </DisplayOptionsProvider>
                                    )}
                                />

                                <Route path="/" exact component={PageHome}></Route>
                            </Switch>
                        </DocumentLocationProvider>
                    </BookProvider>
                </ColorSchemeProvider>
            </DisplayZoomProvider>
        </BrowserRouter>
    );
}
