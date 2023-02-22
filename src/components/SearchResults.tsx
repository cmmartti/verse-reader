import * as db from "../db";
import { Result, SearchBar } from "../routes/search";
import { IndexEntry } from "./IndexEntry";
import { pluralize } from "../util/pluralize";
import React from "react";

export function SearchResults({
   results,
   record,
   currentLoc,
   search,
   clearSearchLink,
}: {
   results: Result[];
   record: db.BookRecord;
   currentLoc: string | null;
   search: string;
   clearSearchLink: React.ReactNode;
}) {
   let statusRef = React.useRef<HTMLElement>(null);

   return (
      <div className="SearchResults">
         <div className="SearchResults-sidebar">
            <div className="SearchResults-sidebarGroup">
               {record.data.title}{" "}
               <b
                  ref={statusRef}
                  tabIndex={-1}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
               >
                  {results.length} {pluralize(search ? "match" : "page", results.length)}
                  {search && ` for “${search}”`}
               </b>
               {clearSearchLink}
            </div>
         </div>

         <div className="SearchResults-main">
            <ol className="reset small expand" role="list">
               {results.map(result => (
                  <li key={result.id}>
                     <IndexEntry
                        url={`/book/${record.id}/${result.id}`}
                        page={record.data.pages[result.id]!}
                        book={record.data}
                        lines={result.lines}
                        isCurrent={currentLoc === result.id}
                     />
                  </li>
               ))}
            </ol>

            <div className="SearchResults-search">
               <SearchBar
                  defaultValue={search}
                  onSubmit={() => {
                     statusRef.current?.focus({ preventScroll: true });
                     document.documentElement.scrollTo({ top: 0 });
                  }}
                  loc={currentLoc}
               />
            </div>
         </div>
      </div>
   );
}
