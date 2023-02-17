import React from "react";

import { pluralize } from "../util/pluralize";
import { ReactComponent as ExpandMoreIcon } from "../icons/expand_more.svg";

export let IndexGroup = React.memo(_IndexGroup);

function _IndexGroup({
   current = false,
   open = true,
   onToggle,
   title,
   length,
   children,
}: {
   current?: boolean;
   open?: boolean;
   title: string;
   length: number;
   onToggle: (open: boolean) => void;
   children?: React.ReactNode;
}) {
   return (
      <div className="IndexGroup">
         <h2 className="reset display-flex">
            <button
               type="button"
               className="reset flex-1 IndexGroup-button"
               onClick={() => onToggle(!open)}
               aria-expanded={open}
               aria-label={`${title}, contains ${length} ${pluralize("match", length)}`}
            >
               <span>
                  {current && (
                     <span className="red" style={{ paddingInlineEnd: "0.25em" }}>
                        •
                     </span>
                  )}
                  <span className="IndexGroup-title">{title}</span>{" "}
                  <span className="nowrap">
                     ({length}
                     <span className="visually-hidden">items</span>)
                  </span>
               </span>

               <ExpandMoreIcon
                  aria-hidden
                  className={"IndexGroup-arrow" + (open ? " --rotate" : "")}
               />
            </button>
         </h2>

         <div className="IndexGroup-contents" hidden={!open}>
            {children}
         </div>
      </div>
   );
}
