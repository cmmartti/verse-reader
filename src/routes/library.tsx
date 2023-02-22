import React from "react";
import { Link, useFetcher, useLoaderData } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import * as db from "../db";
import { useAppState } from "../state";
import { ImportDialog } from "../components/ImportDialog";
import { OptionsDialog } from "../components/OptionsDialog";
import { Spinner } from "../components/Spinner";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";

export let loader = db.getAllBooks;

export function Component() {
   let bookRecords = (useLoaderData() as db.BookRecord[]).sort(
      (a, b) => a.createdAt - b.createdAt
   );

   let fetcher = useFetcher();

   let [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
   let [isOptionsDialogOpen, setIsOptionsDialogOpen] = React.useState(false);
   let { isPromptable, promptToInstall, isInstalled } = useAddToHomeScreenPrompt();

   return (
      <main className="Library">
         <Helmet>
            <title>Verse - Library</title>
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
            <div className="Banner-link">
               <Link to="/about">About</Link>
            </div>
            <h1 className="reset Banner-title Banner-title→">Verse: Library</h1>
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
                     <li>
                        {fetcher.state === "submitting" ? (
                           <div>
                              Downloading Books…
                              <Spinner />
                           </div>
                        ) : (
                           <fetcher.Form method="post" action="/book/new" className="">
                              <input type="hidden" name="url" value="/sample.xml" />
                              <input
                                 type="hidden"
                                 name="url"
                                 value="https://388f63.netlify.app/en-1994.xml"
                              />
                              <input
                                 type="hidden"
                                 name="url"
                                 value="https://388f63.netlify.app/en-2021.xml"
                              />
                              <button type="submit">Download Sample Books</button>
                           </fetcher.Form>
                        )}
                     </li>
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

               {!isInstalled && (
                  <div className="Library-sidebarGroup">
                     <button
                        className="Link"
                        onClick={promptToInstall}
                        disabled={!isPromptable}
                     >
                        Install to Home Screen
                     </button>
                  </div>
               )}
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
      <section className="Library-entry">
         <Link
            to={`/book/${record.id}/${lastViewedLoc ?? initialLoc}`}
            className="Library-entry-link"
         >
            <span className="Library-entry-leaders">
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

         <div className="Library-entry-details">
            {record.data.publisher && (
               <div className="small italic">{record.data.publisher}</div>
            )}
         </div>
      </section>
   );
}
