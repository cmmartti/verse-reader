import { openDB, DBSchema } from "idb/with-async-ittr";
import { Index } from "lunr";

import * as types from "./types";
import { parseXML } from "./parseXML";
import { buildIndex } from "./buildIndex";

interface HymnalDatabase extends DBSchema {
    metadata: {
        value: types.Metadata;
        key: types.DocumentId;
    };
    documents: {
        value: types.HymnalDocument;
        key: types.DocumentId;
    };
    xmlFiles: {
        value: {
            id: types.DocumentId;
            xml: string;
        };
        key: types.DocumentId;
    };
    searchIndices: {
        value: {
            id: types.DocumentId;
            index: object;
        };
        key: types.DocumentId;
    };
}

const DATABASE_VERSION = 3;

let db = openDB<HymnalDatabase>("hymnalreader", DATABASE_VERSION, {
    upgrade: async (upgradeDB, oldVersion, newVersion, tx) => {
        switch (oldVersion) {
            case 0:
                // If the DB does not exist yet, oldVersion will be 0
                upgradeDB.createObjectStore("metadata", { keyPath: "id" });
                upgradeDB.createObjectStore("documents", { keyPath: "id" });
                upgradeDB.createObjectStore("xmlFiles", { keyPath: "id" });
                upgradeDB.createObjectStore("searchIndices", { keyPath: "id" });

            case 1:
                for await (let cursor of tx.objectStore("metadata").iterate()) {
                    let document = await tx
                        .objectStore("documents")
                        .get(cursor.value.id);
                    if (document) {
                        await tx.objectStore("metadata").put({
                            ...cursor.value,
                            title: document.title,
                            year: document.year,
                            publisher: document.publisher,
                        });
                    }
                }
        }
    },
});

export async function deleteDocument(id: types.DocumentId) {
    let tx = (await db).transaction(
        ["metadata", "documents", "xmlFiles", "searchIndices"],
        "readwrite"
    );
    await Promise.all([
        tx.objectStore("metadata").delete(id),
        tx.objectStore("documents").delete(id),
        tx.objectStore("xmlFiles").delete(id),
        tx.objectStore("searchIndices").delete(id),
    ]);
}

export async function addDocument(xmlDocument: XMLDocument) {
    let tx = (await db).transaction(
        ["metadata", "documents", "xmlFiles", "searchIndices"],
        "readwrite"
    );

    let document = parseXML(xmlDocument);
    let metadata = {
        id: document.id,
        lastOpened: 0,
        lastPosition: Object.keys(document.hymns)[0],
        title: document.title,
        year: document.year,
        publisher: document.publisher,
    };
    let xml = new XMLSerializer().serializeToString(xmlDocument);
    let index = buildIndex(document).toJSON();

    await Promise.all([
        tx.objectStore("metadata").put(metadata),
        tx.objectStore("documents").put(document),
        tx.objectStore("xmlFiles").put({ id: document.id, xml }),
        tx.objectStore("searchIndices").put({ id: document.id, index }),
    ]);

    return document;
}

// async function resetData(id: types.DocumentId) {
//     let res = await (await db).transaction("xmlFiles").store.get(id);
//     if (!res)
//         throw new Error(
//             `Document "${id}" has been corrupted or deleted and cannot be recovered.`
//         );

//     let xmlDocument = new DOMParser().parseFromString(res.xml, "text/xml");
//     return addDocument(xmlDocument);
// }

export async function getDocument(id: types.DocumentId) {
    let tx = (await db).transaction(["metadata", "documents"]);
    let [metadata, document] = await Promise.all([
        tx.objectStore("metadata").get(id),
        tx.objectStore("documents").get(id),
    ]);

    if (metadata && document) {
        return { ...metadata, ...document } as const;
    } else throw new Error(`That document does not exist (${id})`);
}

export async function getIndex(id: types.DocumentId) {
    let indexRes = await (await db).transaction("searchIndices").store.get(id);

    let index: lunr.Index;
    if (!indexRes) index = await rebuildIndex(id);
    else index = Index.load(indexRes.index);

    return index;
}

export async function getDocumentList() {
    return (await (await db).transaction("metadata").store.getAll()).sort(
        (a, b) => b.lastOpened - a.lastOpened
    );
}

export async function rebuildIndex(id: types.DocumentId) {
    let tx = (await db).transaction(["documents", "searchIndices"], "readwrite");

    let document = await tx.objectStore("documents").get(id);
    if (document) {
        let index = buildIndex(document);
        tx.objectStore("searchIndices").put({ id, index: index.toJSON() });
        return index;
    } else throw new Error(`That document does not exist (${id})`);
}

export async function setLastPosition(id: types.DocumentId, position: types.HymnId) {
    let store = (await db).transaction("metadata", "readwrite").store;
    let metadata = await store.get(id);
    if (metadata) store.put({ ...metadata, lastPosition: position });
}

export async function setLastOpened(id: types.DocumentId, time: number) {
    let store = (await db).transaction("metadata", "readwrite").store;
    let metadata = await store.get(id);
    if (metadata) store.put({ ...metadata, lastOpened: time });
}
