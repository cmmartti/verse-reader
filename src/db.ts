import { openDB, DBSchema } from "idb/with-async-ittr";

import { parseXML } from "./parseXML";
import { buildIndex } from "./search";
import * as types from "./types";

export type BookRecord = {
   id: number;
   draft: 0 | 1;
   data: types.Hymnal;
   file: Blob;
   lunrIndex: object;
   createdAt: number;
};

interface AppDB extends DBSchema {
   Book: {
      value: BookRecord;
      key: number;
      indexes: { draft: 0 | 1 };
   };
}

const DATABASE_VERSION = 7;

export const db = openDB<AppDB>("hymnalreader", DATABASE_VERSION, {
   upgrade: async (db, oldVersion, newVersion, tx) => {
      switch (oldVersion) {
         // If the DB does not exist yet, oldVersion will be 0
         case 0:
         case 7: {
            let store = db.createObjectStore("Book", {
               keyPath: "id",
               autoIncrement: true,
            });
            store.createIndex("draft", "draft", { unique: false });
            break;
         }
      }
   },
});

export async function createBookFromURL(url: string, draft: boolean) {
   let response = await fetch(url);
   if (response.status !== 200)
      throw new Response(
         `Failed to download resource ${url}: ${response.status} ${response.statusText}`,
         { status: response.status }
      );
   return createBookFromFile(await response.blob(), draft);
}

export async function createBookFromFile(file: Blob, draft: boolean) {
   if (file.type !== "text/xml" && file.type !== "application/xml") {
      throw new Response(`Invalid file type: "${file.type}" should be "text/xml".`, {
         status: 400,
      });
   }

   let xmlDocument = new DOMParser().parseFromString(await file.text(), file.type);
   let errorNode = xmlDocument.querySelector("parsererror");
   if (errorNode) {
      throw new Response("XML parsing failed", { status: 400 });
   }

   let book = parseXML(xmlDocument);
   let lunrIndex = buildIndex(book).toJSON();

   let record = {
      // id will be auto-generated
      draft: draft ? 1 : 0,
      data: book,
      file,
      lunrIndex,
      createdAt: Date.now(),
   } as BookRecord;

   let id = await (await db).put("Book", record);

   // artificial delay
   await new Promise(res => setTimeout(res, 500));

   return id;
}

export async function getAllBooks(): Promise<BookRecord[]> {
   return (await db).getAllFromIndex("Book", "draft", 0);
}

export async function getAllDraftBooks(): Promise<BookRecord[]> {
   return (await db).getAllFromIndex("Book", "draft", 1);
}

export async function deleteAllDraftBooks(): Promise<void> {
   let tx = (await db).transaction("Book", "readwrite");

   for await (let cursor of tx.store.index("draft").iterate(1)) {
      tx.store.delete(cursor.value.id);
   }
}

export async function getBook(id: number): Promise<BookRecord> {
   let res = await (await db).get("Book", id);
   if (res) return res;
   throw new Error(`Book "${id}" does not exist.`);
}

export async function deleteBook(id: number): Promise<void> {
   (await db).delete("Book", id);
}

export async function saveDraftBook(id: number): Promise<void> {
   let tx = (await db).transaction("Book", "readwrite");
   let book = await tx.store.get(id);

   if (!book) throw new Error(`Book "${id}" does not exist.`);

   book.draft = 0;
   await tx.store.put(book);
}

export async function saveAllDraftBooks(): Promise<void> {
   let tx = (await db).transaction("Book", "readwrite");

   for await (let cursor of tx.store.index("draft").iterate(1)) {
      tx.store.put({ ...cursor.value, draft: 0 });
   }
}
