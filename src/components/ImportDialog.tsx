import React from "react";
import { useFetcher, useFetchers } from "react-router-dom";

import * as db from "../db";
import { Spinner } from "../components/Spinner";

export function ImportDialog({
   open,
   onClose,
   records,
}: {
   open: boolean;
   onClose: () => void;
   records: db.BookRecord[];
}) {
   let fetcher = useFetcher();

   let dialogRef = React.useRef<HTMLDialogElement>(null);
   React.useEffect(() => {
      function onMousedown(event: MouseEvent) {
         if (
            event.target instanceof Node &&
            !dialogRef.current?.contains(event.target)
         ) {
            dialogRef.current?.close();
         }
      }

      if (open && dialogRef.current && !dialogRef.current.open) {
         dialogRef.current.showModal();
         document.addEventListener("mousedown", onMousedown);
      }

      if (!open) {
         dialogRef.current?.close();
         document.removeEventListener("mousedown", onMousedown);
      }

      return () => document.removeEventListener("mousedown", onMousedown);
   }, [open]);

   let submitFiles = (filelist: FileList) => {
      if (filelist.length > 0) {
         let formData = new FormData();
         for (let file of filelist) formData.append("file", file);

         fetcher.submit(formData, {
            method: "post",
            action: "/book/new",
            encType: "multipart/form-data",
         });
      }
   };

   type Source = { type: "url"; url: string } | { type: "file"; file: File };

   let inflight = useFetchers()
      .filter(({ formAction }) => formAction?.startsWith("/book/new"))
      .flatMap(({ formData }) => {
         let sources: Source[] = [];

         for (let url of formData?.getAll("url") ?? [])
            if (typeof url === "string") sources.push({ type: "url", url });

         for (let file of formData?.getAll("file") ?? [])
            if (file instanceof File) sources.push({ type: "file", file });

         return sources;
      });

   let [isDraggingOver, setIsDraggingOver] = React.useState(false);

   let fileInputRef = React.useRef<HTMLInputElement>(null);

   return (
      <dialog
         ref={dialogRef}
         className={"ImportDialog" + (isDraggingOver ? " --over" : "")}
         onClose={onClose}
         onDragEnter={event => {
            event.preventDefault();
            setIsDraggingOver(true);
         }}
         onDragLeave={() => {
            setIsDraggingOver(false);
         }}
         onDragOver={event => {
            event.preventDefault();
            setIsDraggingOver(true);
         }}
         onDrop={event => {
            event.preventDefault();
            setIsDraggingOver(false);
            submitFiles(event.dataTransfer.files);
         }}
      >
         <div className="ImportDialog-header">
            <h1 className="reset">Manage Books</h1>
         </div>

         <div className="ImportDialog-contents">
            <p>
               Files should conform to the{" "}
               <a href="/schema.xsd" target="_blank" className="underline">
                  XML schema
               </a>
               .
            </p>

            <ul className="reset ImportDialog-entries" role="list">
               {records.map(record => (
                  <li key={"record:" + record.id} className="ImportDialog-entry">
                     <span className="ImportDialog-entryLabel">
                        <span className="semibold">{record.data.title}</span> (
                        {Math.round(record.file.size / 1000)} kB)
                     </span>

                     <button
                        type="button"
                        className="red"
                        onClick={() => {
                           if (
                              window.confirm(
                                 `Are you sure you want to delete "${record.data.title}"?`
                              )
                           ) {
                              fetcher.submit(null, {
                                 method: "delete",
                                 action: `/book/${record.id}`,
                              });
                           }
                        }}
                     >
                        Delete
                     </button>
                  </li>
               ))}

               {inflight.map((source, i) => (
                  <li key={"inflight:" + i} className="ImportDialog-entry">
                     {source.type === "file" &&
                        `${source.file.name} (${Math.round(
                           source.file.size / 1000
                        )} kB)`}

                     {source.type === "url" && source.url}

                     <Spinner />
                  </li>
               ))}
            </ul>

            {records.length === 0 && inflight.length === 0 && <div>No books yet</div>}

            <div className="">
               <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="text/xml"
                  style={{ display: "none" }}
                  onChange={event => {
                     if (event.target.files instanceof FileList)
                        submitFiles(event.target.files);
                  }}
               />
               <button onClick={() => fileInputRef.current?.click()}>
                  Add from Files
               </button>
            </div>

            <h2 className="reset">Add from external URL</h2>
            <fetcher.Form method="post" action="/book/new">
               <input
                  type="text"
                  name="url"
                  className="section-input"
                  placeholder="https://example.com/book.xml"
               />
               <button type="submit">Download</button>
            </fetcher.Form>

            <fetcher.Form method="post" action="/book/new">
               <button type="submit" name="url" value="/sample.xml">
                  Re-download sample books
               </button>
            </fetcher.Form>

            <p>
               <strong>Caution:</strong> This feature is still in active development.
            </p>
            <p>
               Imported files will not be validated. This process currently has minimal
               error-checking and non-conformant files may crash the app. If this
               happens, you can recover by clearing cookies and website data.
            </p>
         </div>

         <form
            method="dialog"
            className="ImportDialog-footer"
            onSubmit={() => dialogRef.current?.close()}
         >
            <button type="submit" className="semibold">
               Done
            </button>
         </form>
      </dialog>
   );
}
