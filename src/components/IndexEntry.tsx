import React from "react";
import { Link } from "react-router-dom";

import * as types from "../types";

export let IndexEntry = React.memo(_IndexEntry);

function _IndexEntry({
   url,
   page,
   lines = [],
   isCurrent = false,
   book,
}: {
   url: string;
   page: types.Hymn;
   lines?: string[];
   isCurrent?: boolean;
   book: types.Hymnal;
}) {
   let ref = React.useRef<HTMLDivElement>(null);

   return (
      <div
         ref={ref}
         className={
            "IndexEntry" +
            (isCurrent ? " --current" : "") +
            (page.isDeleted ? " --deleted" : "")
         }
      >
         <Link
            to={url}
            className="IndexEntry-link"
            onFocus={() => {
               ref.current?.scrollIntoView({ block: "nearest" });
            }}
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

            <span aria-hidden>{page.id}</span>
            <span className="visually-hidden" role="text">{`Page ${page.id}`}</span>
         </Link>

         {lines.length > 0 && (
            <>
               {/* <div className="visually-hidden">
                  {lines.length} matching line{lines.length > 1 && "s"}:
               </div> */}
               <ul className="reset block IndexEntry-lines">
                  {lines.map((line, i) => (
                     <li key={i}>{line}</li>
                  ))}
               </ul>
            </>
         )}
      </div>
   );
}
