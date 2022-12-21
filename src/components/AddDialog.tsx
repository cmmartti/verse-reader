import React from "react";
import { Helmet } from "react-helmet";

import * as bookService from "../bookService";
import * as types from "../types";
import { useFilePicker } from "../util/useFilePicker";
import DialogElement from "../elements/DialogElement";
import { Form } from "react-router-dom";
import { Spinner } from "./Spinner";
import { useLockBodyScroll } from "../util/useLockBodyScroll";
import { buildIndex } from "../search";
import { parseXML } from "../parseXML";

type FileImport = {
   source:
      | { type: "url"; displayName: string; url: string }
      | { type: "file"; displayName: string; file: File };
   data?: { book: types.Hymnal; index: lunr.Index };
   error?: string;
   size?: number;
   status: "idle" | "loading" | "success" | "error";
};

function delay(seconds: number): Promise<void> {
   return new Promise(resolve => setTimeout(() => resolve(), seconds * 1000));
}

function useAbortController() {
   let abortControllerRef = React.useRef<AbortController>(new AbortController());

   let reset = React.useCallback(() => {
      abortControllerRef.current = new AbortController();
   }, []);

   return {
      signal: abortControllerRef.current.signal,
      abort: () => abortControllerRef.current.abort(),
      reset,
   };
}

export let AddDialog = ({ open, onClose }: { open: boolean; onClose?: () => void }) => {
   useLockBodyScroll(open);

   let [items, setItems] = React.useState<FileImport[]>([]);

   let abortController = useAbortController();

   let update = React.useCallback(
      (i: number, updater: (prev: FileImport) => FileImport) => {
         setItems(items => [
            ...items.slice(0, i),
            updater(items[i]!),
            ...items.slice(i + 1),
         ]);
      },
      []
   );

   React.useEffect(() => {
      let signal = abortController.signal;

      items.forEach(async (item, i) => {
         if (item.status === "idle") {
            update(i, item => ({ ...item, status: "loading" }));

            try {
               let blob: Blob | undefined;
               if (item.source.type === "url") {
                  let res = await fetch(item.source.url, { signal });
                  if (res.status !== 200)
                     throw new Error(`${res.status}: ${res.statusText}`);
                  blob = await res.blob();
               } else if (item.source.type === "file") {
                  blob = item.source.file;
               } else {
                  throw new Error(`Invalid import type`);
               }

               if (blob.type !== "text/xml" && blob.type !== "application/xml") {
                  throw new Error(
                     `Incorrect type: "${blob.type}" should be "text/xml".`
                  );
               }

               let size = blob.size;
               update(i, item => ({ ...item, status: "loading", size }));

               let xmlDocument = new DOMParser().parseFromString(
                  await blob.text(),
                  blob.type
               );

               let errorNode = xmlDocument.querySelector("parsererror");
               if (errorNode) throw new Error("XML parsing failed");

               // TODO: Validate book document
               let book = parseXML(xmlDocument);
               let index = buildIndex(book);

               // await delay(2);

               if (signal.aborted) {
                  throw new DOMException("Aborted", "AbortError");
               }

               update(i, item => ({
                  ...item,
                  data: { book, index },
                  status: "success",
               }));
            } catch (error) {
               if (error instanceof Error && error.name === "AbortError") return;

               console.error(error);

               let message = error instanceof Error ? error.message : String(error);
               update(i, item => ({ ...item, error: message, status: "error" }));
            }
         }
      });
   }, [items, abortController, update]);

   let [inputValue, setInputValue] = React.useState("");

   let dialogRef = React.useRef<DialogElement>(null!);

   let filepicker = useFilePicker<HTMLFormElement>(
      filelist => {
         setItems(items => [
            ...items,
            ...Array.from(filelist).map(file => ({
               source: { type: "file" as const, file, displayName: file.name },
               status: "idle" as const,
               step: null,
            })),
         ]);
      },
      { accept: "text/xml", multiple: true }
   );

   React.useEffect(() => {
      let dialog = dialogRef.current;
      if (!dialog) return;

      let fn = () => {
         setItems([]);
         abortController.abort();
         abortController.reset();
         if (typeof onClose === "function" && !dialog.open) onClose();
      };
      if (dialog.open) dialog.addEventListener("super-dialog-toggle", fn);
      return () => dialog.removeEventListener("super-dialog-toggle", fn);
   }, [onClose, abortController]);

   return (
      <super-dialog
         class="AddDialog"
         ref={dialogRef}
         open={open ? "" : null}
         aria-labelledby="dialog-title"
      >
         {open && (
            <Helmet>
               <title>Hymnal - Add Books</title>
            </Helmet>
         )}

         <div className="-overlay" onClick={() => dialogRef.current.toggle(false)} />

         <Form
            className={"-window" + (filepicker.isOver ? " is-over" : "")}
            {...filepicker.innerProps}
            ref={filepicker.innerRef}
            onSubmit={async () => {
               for await (let item of items) {
                  bookService.importBook(item.data!);
               }
               dialogRef.current.toggle(false);
            }}
         >
            <header className="-titlebar">
               <div className="-gutter">
                  <button
                     className="Button"
                     type="button"
                     onClick={() => dialogRef.current.toggle(false)}
                  >
                     Cancel
                  </button>
               </div>
               <h2 id="dialog-title" className="reset bold">
                  Add Books
               </h2>
               <div className="-gutter">
                  {items.some(item => item.status === "loading") ? (
                     <Spinner />
                  ) : (
                     <button
                        type="submit"
                        className="Button"
                        disabled={
                           items.length === 0 ||
                           !items.every(item => item.status === "success")
                        }
                     >
                        <b>Import</b>
                     </button>
                  )}
               </div>
            </header>

            <div className="-contents">
               {filepicker.hiddenFileInput}

               <h2 className="section-header">Books to Import</h2>
               {items.map((item, i) => (
                  <ImportItem
                     key={i}
                     item={item}
                     remove={() => {
                        setItems(items => [...items.slice(0, i), ...items.slice(i + 1)]);
                     }}
                  />
               ))}

               <div className="section">
                  {items.length === 0 && (
                     <div className="subdued">No pending imports</div>
                  )}
               </div>

               <div className="section">
                  <button
                     type="button"
                     className="section-button"
                     onClick={filepicker.promptForFiles}
                  >
                     Add from Files
                  </button>
               </div>

               <h2 className="section-header">Add from external URL</h2>
               <div className="section">
                  <div className="section-input">
                     <input
                        type="url"
                        className="section-input"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        placeholder="https://example.com/book.xml"
                     />
                  </div>
                  <button
                     type="button"
                     className="section-button"
                     onClick={() => {
                        setItems(items => [
                           ...items,
                           {
                              source: {
                                 type: "url",
                                 url: inputValue,
                                 displayName: inputValue,
                              },
                              status: "idle",
                           },
                        ]);
                     }}
                  >
                     Download
                  </button>
               </div>

               <div className="dropMessage">
                  <p>
                     Files should conform to the{" "}
                     <a href="/schema.xsd" target="_blank">
                        XML schema
                     </a>
                     .
                  </p>
                  <p>
                     Imported files will not be validated. This process has minimal
                     error-checking and non-conformant files may crash the app. If this
                     happens, you can recover by clearing cookies and website data.
                  </p>
               </div>

               <div className="section">
                  <button
                     type="button"
                     className="section-button"
                     // onClick={filepicker.promptForFiles}
                  >
                     Restore sample books
                  </button>
               </div>
            </div>
         </Form>
      </super-dialog>
   );
};

function ImportItem({ item, remove }: { item: FileImport; remove: () => void }) {
   let stats = [
      { name: "Source", value: item.source.displayName },
      {
         name: "Size",
         value: item.size ? `${Math.round(item.size / 1000)} kB` : null,
      },
      {
         name: "ID",
         value: item.data?.book.id ?? null,
      },
      {
         name: "Title/Year",
         value: item.data ? `${item.data.book.title} (${item.data.book.year})` : null,
      },
      {
         name: "Publisher",
         value: item.data?.book.publisher ?? null,
      },
      {
         name: "Contains",
         value: item.data ? `${Object.keys(item.data.book.pages).length} pages` : null,
      },
   ];
   return (
      <div className="ImportItem">
         <div className="-stats">
            {stats.map((stat, i) => (
               <p key={i}>
                  <span>{stat.name}</span>
                  <span>{stat.value ?? "--"}</span>
               </p>
            ))}
         </div>

         {item.status === "loading" && <div>Processing</div>}
         {item.status === "idle" && <div>Processing</div>}
         {item.status === "error" && (
            <div>
               <p>{item.error}</p>
            </div>
         )}
         {(item.status === "error" || item.status === "success") && (
            <button
               onClick={remove}
               type="button"
               className="Button color-warning"
               aria-label="remove"
               title="Remove"
            >
               Remove
            </button>
         )}
      </div>
   );
}
