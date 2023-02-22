import React from "react";
import { Link } from "react-router-dom";

import * as types from "../types";

export let IndexEntry = React.memo(_IndexEntry);

function _IndexEntry({
   url,
   page,
   lines,
   isCurrent = false,
   book,
}: {
   url: string;
   page: types.Hymn;
   lines: string[];
   isCurrent?: boolean;
   book: types.Hymnal;
}) {
   return (
      <div
         className={
            "IndexEntry" +
            (isCurrent ? " --current" : "") +
            (page.isDeleted ? " --deleted" : "")
         }
      >
         <Link
            to={url}
            className="IndexEntry-link"
            onFocus={e => e.target.parentElement?.scrollIntoView({ block: "nearest" })}
         >
            <span className="IndexEntry-leaders">
               <span
                  className="IndexEntry-title"
                  lang={page.language !== book.language ? page.language : undefined}
               >
                  {page.isRestricted && "*"}
                  {page.title || "(no title)"}
               </span>

               <span aria-hidden className="-dots" />
            </span>

            <span aria-hidden> {page.id}</span>
            <span className="visually-hidden" role="text">{`Page ${page.id}`}</span>
         </Link>

         {lines.length > 0 && (
            <ul className="reset block IndexEntry-lines">
               {lines.map((line, i) => (
                  <li key={i}>{line}</li>
               ))}
            </ul>
         )}
      </div>
   );
}
