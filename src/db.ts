import { openDB, DBSchema } from "idb/with-async-ittr";
import { Index } from "lunr";

import { HymnalDocument } from "./types";
import { parseXML } from "./parseXML";
import { buildIndex } from "./buildIndex";

export type Metadata = {
    id: string;
    lastOpened: number;
    lastPosition: string;
};

export type MetadataPlusTitle = Metadata & { title: string };

interface HymnalDatabase extends DBSchema {
    metadata: {
        value: Metadata;
        key: string;
    };
    documents: {
        value: HymnalDocument;
        key: string;
    };
    xmlFiles: {
        value: {
            id: string;
            xml: string;
        };
        key: string;
    };
    searchIndices: {
        value: {
            id: string;
            index: object;
        };
        key: string;
    };
}

const DATABASE_VERSION = 1;

let db = openDB<HymnalDatabase>("hymnalreader", DATABASE_VERSION, {
    upgrade: (upgradeDB, oldVersion) => {
        switch (oldVersion) {
            case 0:
                // If the DB does not exist yet, oldVersion will be 0
                upgradeDB.createObjectStore("metadata", { keyPath: "id" });
                upgradeDB.createObjectStore("documents", { keyPath: "id" });
                upgradeDB.createObjectStore("xmlFiles", { keyPath: "id" });
                upgradeDB.createObjectStore("searchIndices", { keyPath: "id" });
            case 1:
            // Put any DB version changes in a new case
        }
    },
});

export async function deleteDocument(id: string) {
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

// async function resetData(id: string) {
//     let res = await (await db).transaction("xmlFiles").store.get(id);
//     if (!res)
//         throw new Error(
//             `Document "${id}" has been corrupted or deleted and cannot be recovered.`
//         );

//     let xmlDocument = new DOMParser().parseFromString(res.xml, "text/xml");
//     return addDocument(xmlDocument);
// }

export async function getDocument(id: string) {
    let tx = (await db).transaction(["metadata", "documents", "searchIndices"]);
    let [metadata, document, indexRes] = await Promise.all([
        tx.objectStore("metadata").get(id),
        tx.objectStore("documents").get(id),
        tx.objectStore("searchIndices").get(id),
    ]);

    let index: lunr.Index;
    if (!indexRes) index = await rebuildIndex(id);
    else index = Index.load(indexRes.index);

    if (metadata && document) {
        return [metadata, document, index] as const;
    } else throw new Error(`That document does not exist (${id})`);
}

export async function getDocumentList() {
    let tx = (await db).transaction(["metadata", "documents"], "readonly");

    let list: MetadataPlusTitle[] = [];
    for await (let cursor of tx.objectStore("metadata").iterate()) {
        let document = await tx.objectStore("documents").get(cursor.value.id);
        if (document) list.push({ ...cursor.value, title: document.title });
    }

    return list;
}

export async function rebuildIndex(id: string) {
    let tx = (await db).transaction(["documents", "searchIndices"], "readwrite");

    let document = await tx.objectStore("documents").get(id);
    if (document) {
        let index = buildIndex(document);
        tx.objectStore("searchIndices").put({ id, index: index.toJSON() });
        return index;
    } else throw new Error(`That document does not exist (${id})`);
}

export async function setLastPosition(id: string, position: string) {
    let store = (await db).transaction("metadata", "readwrite").store;
    let metadata = await store.get(id);
    if (metadata) store.put({ ...metadata, lastPosition: position });
}

export async function setLastOpened(id: string, time: number) {
    let store = (await db).transaction("metadata", "readwrite").store;
    let metadata = await store.get(id);
    if (metadata) store.put({ ...metadata, lastOpened: time });
}
