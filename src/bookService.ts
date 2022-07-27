import { openDB, DBSchema } from "idb/with-async-ittr";
import { Index } from "lunr";

import { buildIndex } from "./search";
import { parseXML } from "./parseXML";
import * as types from "./types";

interface AppDB extends DBSchema {
    summary: {
        key: types.DocumentId;
        value: types.Summary;
    };
    book: {
        key: types.DocumentId;
        value: types.Hymnal;
    };
    linesIndex: {
        key: types.DocumentId;
        value: { id: types.DocumentId; index: object };
    };
}

const DATABASE_VERSION = 1;

let db = openDB<AppDB>("hymnalreader", DATABASE_VERSION, {
    upgrade: async (upgradeDB, oldVersion, newVersion, tx) => {
        switch (oldVersion) {
            case 0:
                // If the DB does not exist yet, oldVersion will be 0
                upgradeDB.createObjectStore("summary", { keyPath: "id" });
                upgradeDB.createObjectStore("book", { keyPath: "id" });
                upgradeDB.createObjectStore("linesIndex", { keyPath: "id" });
        }
    },
});

export async function getAllSummaries(): Promise<types.Summary[]> {
    let res = await (await db).getAll("summary");
    if (res) return res;
    else
        throw new Error(
            "There was an error while fetching the list of available books."
        );
}

export async function getBook(id: types.DocumentId): Promise<types.Hymnal> {
    let res = await (await db).get("book", id);
    if (res) return res;
    else throw new Error(`Book "${id}" does not exist.`);
}

export async function getIndexOfLines(id: types.DocumentId): Promise<lunr.Index> {
    let res = await (await db).get("linesIndex", id);
    if (res) return Index.load(res.index);
    else throw new Error(`Line index for book "${id}" does not exist.`);
}

export async function uploadBook(xmlString: string): Promise<types.Hymnal> {
    let xmlDocument = new DOMParser().parseFromString(xmlString, "text/xml");

    // Assume that the XML file is valid

    let book = parseXML(xmlDocument);

    let tx = (await db).transaction(["book", "summary", "linesIndex"], "readwrite");

    await Promise.all([
        tx.objectStore("book").put(book),
        tx.objectStore("summary").put({
            id: book.id,
            title: book.title,
            publisher: book.publisher,
            year: book.year,
            language: book.language,
            pageCount: Object.keys(book.pages).length,
        }),
        tx.objectStore("linesIndex").put({
            id: book.id,
            index: buildIndex(book).toJSON(),
        }),
    ]);

    return book;
}

export async function deleteBook(id: types.DocumentId): Promise<void> {
    let tx = (await db).transaction(["summary", "book"], "readwrite");

    await Promise.all([
        tx.objectStore("summary").delete(id),
        tx.objectStore("book").delete(id),
    ]);
}