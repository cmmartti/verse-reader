import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";

export function Component() {
   return (
      <main className="Library">
         <Helmet>
            <title>Verse - Library</title>
         </Helmet>

         <div className="Banner">
            <div className="Banner-link">
               <Link to="/about">Back</Link>
            </div>
            <h1 className="reset Banner-title Banner-title→">Search Help</h1>
         </div>

         <div className="Library-contents">
            <div className="Library-main"></div>

            <div className="Library-sidebar"></div>
         </div>
      </main>
   );
}
