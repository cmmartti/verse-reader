import React from "react";
import {BrowserRouter, Switch, Route} from "react-router-dom";

import {HomePage} from "./HomePage";
import {DocumentPage} from "./DocumentPage";

import {ColorSchemeProvider} from "../util/useColorScheme";
import {DisplayZoomProvider} from "../util/useDisplayZoom";

import "./App.scss";
import "@github/details-dialog-element";
// import "@github/details-menu-element";

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
                    <Switch>
                        <Route
                            path="/:id"
                            render={({match}) => <DocumentPage id={match.params.id} />}
                        />

                        <Route path="/" exact component={HomePage}></Route>
                    </Switch>
                </ColorSchemeProvider>
            </DisplayZoomProvider>
        </BrowserRouter>
    );
}
