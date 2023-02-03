import React from "react";
import {
   ActionFunctionArgs,
   Form,
   redirect,
   useFetcher,
   useFetchers,
   useLoaderData,
   useSubmit,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";

import * as db from "../db";
import { Spinner } from "../components/Spinner";

export let loader = db.getAllDraftBooks;

export async function action({ request }: ActionFunctionArgs) {
   switch (request.method.toLowerCase()) {
      case "delete":
         await db.deleteAllDraftBooks();
         return redirect("/");
      case "post":
         await db.saveAllDraftBooks();
         return redirect("/");
   }
}

export function Component() {
   let fileInputRef = React.useRef<HTMLInputElement>(null);

   let submit = useSubmit();
   let fetcher = useFetcher();

   let submitFiles = (filelist: FileList) => {
      if (filelist.length > 0) {
         let formData = new FormData();
         for (let file of filelist) formData.append("file", file);

         fetcher.submit(formData, {
            method: "post",
            action: "/draft/new",
            encType: "multipart/form-data",
         });
      }
   };

   let submittedDrafts = useLoaderData() as db.BookRecord[];

   type Source = { type: "url"; url: string } | { type: "file"; file: File };

   let inProgressDrafts = useFetchers()
      .filter(({ formAction }) => formAction?.startsWith("/draft/new"))
      .flatMap(({ formData }) => {
         let sources: Source[] = [];

         for (let url of formData?.getAll("url") ?? [])
            if (typeof url === "string") sources.push({ type: "url", url });

         for (let file of formData?.getAll("file") ?? [])
            if (file instanceof File) sources.push({ type: "file", file });

         return sources;
      });

   let [isDraggingOver, setIsDraggingOver] = React.useState(false);

   let cancelFormRef = React.useRef<HTMLFormElement>(null!);

   return (
      <main className="AddDialog">
         <Helmet>
            <title>Hymnal - Add Books</title>
         </Helmet>

         <div className="-overlay" onClick={() => submit(cancelFormRef.current)}></div>

         <div
            className={"-window" + (isDraggingOver ? " is-over" : "")}
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
            <header className="-titlebar">
               <Form
                  className="-gutter"
                  action="/draft"
                  method="delete"
                  ref={cancelFormRef}
               >
                  <button type="submit" className="Button">
                     Cancel
                  </button>
               </Form>

               <h1 id="dialog-title" className="reset bold -title">
                  Add Books
               </h1>

               <Form className="-gutter" action="/draft" method="post">
                  <button
                     type="submit"
                     className="Button"
                     disabled={
                        submittedDrafts.length === 0 || inProgressDrafts.length > 0
                     }
                  >
                     {inProgressDrafts.length > 0 ? <Spinner /> : <b>Import</b>}
                  </button>
               </Form>
            </header>

            <div className="-contents">
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

               <h2 className="section-header">Books to Import</h2>

               {submittedDrafts.map(record => (
                  <ImportItem
                     key={record.id}
                     id={record.id}
                     title={record.data.title}
                     contains={Object.keys(record.data.pages).length}
                     publisher={record.data.publisher ?? undefined}
                     sizeKb={Math.round(record.file.size / 1000)}
                  />
               ))}

               {inProgressDrafts.map((source, i) => {
                  if (source.type === "file")
                     return (
                        <ImportItem
                           key={i}
                           title={source.file.name}
                           sizeKb={Math.round(source.file.size / 1000)}
                           status="Loading…"
                        />
                     );
                  else if (source.type === "url")
                     return <ImportItem key={i} title={source.url} status="Loading…" />;
                  else return null;
               })}

               <div className="section">
                  {submittedDrafts.length === 0 && inProgressDrafts.length === 0 && (
                     <div className="subdued">No pending imports</div>
                  )}
               </div>

               <div className="section">
                  <input
                     ref={fileInputRef}
                     name="file"
                     type="file"
                     multiple
                     accept="text/xml"
                     style={{ display: "none" }}
                     onChange={event => {
                        if (event.target.files instanceof FileList)
                           submitFiles(event.target.files);
                     }}
                  />
                  <button
                     className="section-button"
                     onClick={() => fileInputRef.current?.click()}
                  >
                     Add from Files
                  </button>
               </div>

               <h2 className="section-header">Add from external URL</h2>
               <fetcher.Form method="post" action="/draft/new" className="section">
                  <div className="section-input">
                     <input
                        type="text"
                        name="url"
                        className="section-input"
                        placeholder="https://example.com/book.xml"
                     />
                  </div>
                  <button type="submit" className="section-button">
                     Download
                  </button>
               </fetcher.Form>

               <fetcher.Form method="post" action="/draft/new" className="section">
                  <button
                     type="submit"
                     name="url"
                     value="/sample.xml"
                     className="section-button"
                  >
                     Re-download sample
                  </button>
               </fetcher.Form>
            </div>
         </div>
      </main>
   );
}

function ImportItem({
   id,
   title,
   publisher,
   contains,
   sizeKb,
   status,
}: {
   id?: string | number;
   title: string;
   publisher?: string;
   contains?: number;
   sizeKb?: number;
   status?: string;
}) {
   let fetcher = useFetcher();

   return (
      <div className="ImportItem">
         <div className="-stats">
            <p>
               <span>Title</span>
               <span>{title}</span>
            </p>
            <p>
               <span>Publisher</span>
               <span>{publisher}</span>
            </p>
            <p>
               <span>Contains</span>
               <span>{contains && contains + " pages"}</span>
            </p>
            <p>
               <span>Size</span>
               <span>{sizeKb && sizeKb + " kB"}</span>
            </p>
         </div>

         {status && <div>{status}</div>}

         {id && (
            <fetcher.Form method="delete" action={`/draft/${id}`}>
               <button className="Button color-warning">Remove</button>
            </fetcher.Form>
         )}
      </div>
   );
}
