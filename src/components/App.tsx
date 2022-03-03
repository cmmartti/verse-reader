import "@github/details-dialog-element";
import "@github/details-menu-element";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import { ManagePage } from "./ManagePage";
import { MainPage } from "./MainPage";
import { NotFound } from "./NotFound";
import { DisplayOptionsProvider } from "../util/useDisplayOptions";
import { getDocuments } from "../util/documentRepository";

import "./App.scss";

declare global {
    namespace JSX {
        interface IntrinsicElements {
            // "details-dialog": React.DetailedHTMLProps<
            //     React.HTMLAttributes<HTMLElement>,
            //     HTMLElement
            // >;
            "details-dialog": any;
            "details-menu": any;
        }
    }
}

export const App = () => {
    const bookList = getDocuments();
    const mru = bookList.reduce(
        (prev, cur) => (prev.lastOpened >= cur.lastOpened ? prev : cur),
        { id: "en-1994", lastOpened: 0 }
    );
    return (
        <DisplayOptionsProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/manage" element={<ManagePage />} />

                    {bookList.map(book => (
                        <Route
                            key={book.id}
                            path={`/${book.id}`}
                            element={
                                <MainPage
                                    id={book.id}
                                    lastPosition={book.lastPosition}
                                />
                            }
                        />
                    ))}

                    {bookList.map(book => (
                        <Route
                            key={book.id}
                            path={`/${book.id}/:position`}
                            element={
                                <MainPage
                                    id={book.id}
                                    lastPosition={book.lastPosition}
                                />
                            }
                        />
                    ))}

                    <Route path="/" element={<Navigate replace to={"/" + mru.id} />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </DisplayOptionsProvider>
    );
};
