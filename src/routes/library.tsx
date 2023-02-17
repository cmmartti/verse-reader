import React from "react";
import { Link, useFetcher, useLoaderData } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import * as db from "../db";
import { useAppState } from "../state";
import { ImportDialog } from "../components/ImportDialog";
import { OptionsDialog } from "../components/OptionsDialog";

const SAMPLE_URL = "/sample.xml";

export let loader = db.getAllBooks;

export function Component() {
   let bookRecords = (useLoaderData() as db.BookRecord[]).sort(
      (a, b) => a.createdAt - b.createdAt
   );

   let fetcher = useFetcher();

   let [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
   let [isOptionsDialogOpen, setIsOptionsDialogOpen] = React.useState(false);

   return (
      <main className="Library">
         <Helmet>
            <title>Verse Reader</title>
         </Helmet>

         <ImportDialog
            open={isImportDialogOpen}
            onClose={() => setIsImportDialogOpen(false)}
            records={bookRecords}
         />

         <OptionsDialog
            open={isOptionsDialogOpen}
            onClose={() => setIsOptionsDialogOpen(false)}
         />

         <div className="Banner">
            <div></div>
            <h1 className="reset Banner-title Banner-title→">Verse: Library</h1>
            <Link to="/about">About</Link>
         </div>

         <div className="Library-contents">
            <div className="Library-main">
               <div aria-hidden className="small text-align-end">
                  Page
               </div>

               <ul className="reset Library-entries" role="list">
                  {bookRecords.map((record, i) => (
                     <li key={record.id}>
                        <BookEntry record={record} />
                     </li>
                  ))}

                  {bookRecords.length === 0 && (
                     <fetcher.Form method="post" action="/book/new" className="">
                        <button
                           type="submit"
                           className="Button"
                           name="url"
                           value={SAMPLE_URL}
                        >
                           Download Sample
                        </button>
                        {fetcher.state === "submitting" && "Loading…"}
                     </fetcher.Form>
                  )}
               </ul>
            </div>

            <div className="Library-sidebar">
               <div className="Library-sidebarGroup">
                  <button
                     className="reset Link"
                     onClick={() => setIsImportDialogOpen(!isImportDialogOpen)}
                  >
                     Add/Remove Books
                  </button>
               </div>
               <div className="Library-sidebarGroup">
                  <button
                     className="reset Link"
                     onClick={() => setIsOptionsDialogOpen(!isOptionsDialogOpen)}
                  >
                     Display Options
                  </button>
               </div>
            </div>
         </div>
      </main>
   );
}

function BookEntry({ record }: { record: db.BookRecord }) {
   let allLocs = Object.keys(record.data.pages);
   let initialLoc = allLocs[0];

   let [lastViewedLoc] = useAppState(`book/${record.id}/loc`);

   return (
      <section className="BookEntry">
         <Link
            to={`/book/${record.id}/${lastViewedLoc ?? initialLoc}`}
            className="BookEntry-link"
         >
            <span className="BookEntry-leaders">
               <h2 className="reset semibold">
                  {record.data.title}
                  {record.data.subtitle && `: ${record.data.subtitle}`}
               </h2>

               <span aria-hidden className="-dots" />
            </span>

            <span className="small">
               {lastViewedLoc ?? initialLoc}/{Object.keys(record.data.pages).length + ""}
            </span>
         </Link>

         <div className="BookEntry-details">
            {record.data.publisher && (
               <div className="small italic">{record.data.publisher}</div>
            )}
         </div>
      </section>
   );
}
