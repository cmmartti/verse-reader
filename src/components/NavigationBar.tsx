import React from "react";
import { Link } from "react-router-dom";

import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";

export function NavigationBar({
   title,
   back,
   tools,
}: {
   title: string;
   back?: {
      to: string;
      title: string;
   };
   tools?: React.ReactNode;
}) {
   return (
      <div className="NavigationBar">
         <div className="-back">
            {back && (
               <Link
                  className="Button"
                  to={back.to}
                  aria-label={back.title}
                  title={back.title}
               >
                  <BackIcon aria-hidden />
                  {/* {back.title} */}
               </Link>
            )}
         </div>
         <div className="-title">
            <h1 className="-contents">{title}</h1>
         </div>
         <div className="-tools">{tools}</div>
      </div>
   );
}
