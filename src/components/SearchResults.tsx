import * as db from "../db";
import { Result } from "../routes/search";
import { IndexEntry } from "./IndexEntry";
import { pluralize } from "../util/pluralize";

export function SearchResults({
   results,
   record,
   currentLoc,
   search,
   clearSearchLink,
   searchInput,
}: {
   results: Result[];
   record: db.BookRecord;
   currentLoc: string | null;
   search: string;
   clearSearchLink: React.ReactNode;
   searchInput: React.ReactNode;
}) {
   return (
      <div className="SearchResults">
         <div className="SearchResults-sidebar">
            <div className="SearchResults-sidebarGroup">
               {record.data.title}{" "}
               <b role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>
                  {results.length} {pluralize(search ? "match" : "page", results.length)}
                  {search && ` for “${search}”`}
               </b>
               {clearSearchLink}
            </div>
         </div>

         <div className="SearchResults-main">
            <ol className="reset SearchResults-results" role="list">
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

            <div className="SearchResults-search">{searchInput}</div>
         </div>
      </div>
   );
}
