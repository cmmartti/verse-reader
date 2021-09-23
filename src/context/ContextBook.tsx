import React from "react";
import {Result} from "@badrap/result";

import {
    DocumentMetadata,
    getDocuments,
    addDocument,
    deleteDocument,
    getDocument,
} from "../documentRepository";

type BookContextValue = {
    bookList: DocumentMetadata[];
    addBook: (newBook: XMLDocument) => Result<DocumentMetadata>;
    getBook: (id: string) => XMLDocument;
    deleteBook: (id: string) => void;
};

export const BooksContext = React.createContext<BookContextValue | undefined>(undefined);

export type BookProviderProps = {children: React.ReactNode};

export function BookProvider({children}: BookProviderProps) {
    const documentCache = React.useRef<{[id: string]: XMLDocument}>({});

    const [bookList, setBookList] = React.useState<DocumentMetadata[]>(
        getDocuments().unwrap()
    );

    const addBook = React.useCallback((newBook: XMLDocument) => {
        const res = addDocument(newBook);
        if (res.isOk) setBookList(getDocuments().unwrap());
        return res;
    }, []);

    const getBook = React.useCallback((id: string) => {
        if (!(id in documentCache)) {
            const book = getDocument(id);
            if (book.isOk) {
                documentCache.current[id] = book.unwrap();
            }
        }
        return documentCache.current[id];
    }, []);

    const deleteBook = React.useCallback((id: string) => {
        const res = deleteDocument(id);
        if (res.isOk) setBookList(getDocuments().unwrap());
        return res;
    }, []);

    const [contextValue, setContextValue] = React.useState({
        bookList,
        getBook,
        addBook,
        deleteBook,
    });

    React.useEffect(() => {
        setContextValue({
            bookList,
            addBook,
            getBook,
            deleteBook,
        });
    }, [bookList, addBook, getBook, deleteBook]);

    return (
        <BooksContext.Provider value={contextValue}>{children}</BooksContext.Provider>
    );
}

export function useBooks() {
    const context = React.useContext(BooksContext);
    if (context === undefined) {
        throw new Error("useBooks must be within BookProvider");
    }
    return context;
}
