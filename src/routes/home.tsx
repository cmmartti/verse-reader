import React from "react";
import { Link, useFetcher, useLoaderData, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import { RadioButtons } from "../components/RadioButtons";

import { ReactComponent as BookIcon } from "../icons/book.svg";
import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "../icons/delete.svg";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import { useOption } from "../options";
import * as db from "../db";

const SAMPLE_URL = "/sample.xml";

export let loader = db.getAllBooks;

export function Component() {
   let [colorScheme, setColorScheme] = useOption("colorScheme");

   let { isPromptable, promptToInstall, isInstalled } = useAddToHomeScreenPrompt();

   let bookRecords = (useLoaderData() as db.BookRecord[]).sort(
      (a, b) => a.createdAt - b.createdAt
   );

   let fetcher = useFetcher();

   return (
      <main className="Home">
         <Helmet>
            <title>Hymnal - Library</title>
         </Helmet>

         <h1 className="-title">Library</h1>

         <div className="-contents">
            <ul className="reset -titles">
               {bookRecords.map(record => (
                  <li key={record.id}>
                     <BookCover record={record} />
                  </li>
               ))}

               {bookRecords.length === 0 && (
                  <li>
                     <fetcher.Form
                        method="post"
                        action="/book/new"
                        className="BookCover --ghost"
                     >
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
                  </li>
               )}
            </ul>

            <div className="-buttons">
               <Link to="/draft" className="-button">
                  Add Books
               </Link>
            </div>
         </div>

         <div className="-settings">
            <fieldset className="-radioSet" title="Color Scheme">
               <RadioButtons
                  name="color-scheme"
                  value={colorScheme}
                  options={[
                     { value: "light", children: "Light" },
                     { value: "system", children: "Auto" },
                     { value: "dark", children: "Dark" },
                  ]}
                  onChange={setColorScheme}
               />
            </fieldset>

            {!isInstalled && (
               <button
                  className="Button"
                  onClick={promptToInstall}
                  disabled={!isPromptable}
               >
                  Install to Home Screen
               </button>
            )}
         </div>
      </main>
   );
}

function BookCover({ record }: { record: db.BookRecord }) {
   let htmlId = React.useId();
   let to = `/book/${record.id}`;

   let fetcher = useFetcher();

   return (
      <div className="BookCover">
         <div className="-container">
            <div className="-icon">
               <BookIcon aria-hidden />
            </div>

            <h2 className="reset -title">
               <Link to={to}>{record.data.title}</Link>
            </h2>

            {record.data.subtitle && (
               <h3 className="reset -subtitle">{record.data.subtitle}</h3>
            )}

            {record.data.publisher && (
               <div className="-publisher">{record.data.publisher}</div>
            )}

            <div className="-year">{record.data.year}</div>
            <div className="-pages">{Object.keys(record.data.pages).length} pages</div>
         </div>

         {/* <Link to={to} className="-linkOverlay" aria-hidden tabIndex={-1}>
            {record.data.title}
         </Link> */}

         <h-menubutton
            class="Button -menuButton"
            for={htmlId}
            aria-owns={htmlId}
            placement="auto"
            eat-dismiss-clicks=""
            aria-label="options"
            title="Options"
         >
            <MoreIcon aria-hidden />
         </h-menubutton>

         <h-menu id={htmlId} class="Menu">
            <h-menuitem
               type="button"
               class="color-warning"
               onClick={() => {
                  if (
                     window.confirm(
                        `Are you sure you want to delete "${record.data.title}"?`
                     )
                  ) {
                     fetcher.submit(null, {
                        method: "delete",
                        action: `/book/${record.id}`,
                     });
                  }
               }}
            >
               Delete <DeleteIcon aria-hidden />
            </h-menuitem>
         </h-menu>
      </div>
   );
}
