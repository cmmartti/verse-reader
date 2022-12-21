import React from "react";
import { Link, useLoaderData, useSearchParams, useSubmit } from "react-router-dom";
import { Helmet } from "react-helmet";

import { AddDialog } from "./AddDialog";

import { ReactComponent as BookIcon } from "../icons/book.svg";
// import { ReactComponent as ArrowForward } from "../icons/arrow-forward-ios.svg";
import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { ReactComponent as DeleteIcon } from "../icons/delete.svg";
import * as types from "../types";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";
import { Menu } from "./Menu";
import { useOption } from "../options";

export function Home() {
   let submit = useSubmit();

   let [colorScheme, setColorScheme] = useOption("colorScheme");

   let { isPromptable, promptToInstall, isInstalled } = useAddToHomeScreenPrompt();

   let list = useLoaderData() as types.Summary[];

   let [searchParams, setSearchParams] = useSearchParams();
   let isDialogOpen = searchParams.get("add") === "true";
   let toggleDialog = React.useCallback(
      (open: boolean) => {
         setSearchParams(prev => {
            let params = new URLSearchParams(prev);
            if (open) params.set("add", "true");
            else params.delete("add");
            return params;
         });
      },
      [setSearchParams]
   );

   return (
      <main className="Home">
         <Helmet>
            <title>Hymnal - Library</title>
         </Helmet>
         <div className="-header">
            <h1 className="-title">Library</h1>
         </div>

         <div className="-contents">
            {list.map(book => (
               <BookCover
                  key={book.id}
                  book={book}
                  deleteSelf={() => {
                     let formData = new FormData();
                     formData.append("id", book.id);
                     submit(formData, { method: "delete", action: "/" });
                  }}
               />
            ))}

            {list.length === 0 && <div className="BookCover --empty"></div>}

            <div className="-buttons">
               <button className="-button" onClick={() => toggleDialog(true)}>
                  Add Books
               </button>
            </div>
         </div>
         <div className="-settings">
            <fieldset className="-radioSet" title="Color Scheme">
               <legend className="visually-hidden">Color Scheme</legend>
               <label
                  className={"-radio" + (colorScheme === "light" ? " --checked" : "")}
               >
                  Light
                  <input
                     type="radio"
                     name="color-scheme"
                     value="light"
                     checked={colorScheme === "light"}
                     onChange={e => {
                        if (e.target.checked) setColorScheme(e.target.value);
                     }}
                  />
               </label>

               <label
                  className={"-radio" + (colorScheme === "system" ? " --checked" : "")}
               >
                  Auto
                  <input
                     type="radio"
                     name="color-scheme"
                     value="system"
                     checked={colorScheme === "system"}
                     onChange={e => {
                        if (e.target.checked) setColorScheme(e.target.value);
                     }}
                  />
               </label>

               <label
                  className={"-radio" + (colorScheme === "dark" ? " --checked" : "")}
               >
                  Dark
                  <input
                     type="radio"
                     name="color-scheme"
                     value="dark"
                     checked={colorScheme === "dark"}
                     onChange={e => {
                        if (e.target.checked) setColorScheme(e.target.value);
                     }}
                  />
               </label>
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

         <AddDialog open={isDialogOpen} onClose={() => toggleDialog(false)} />
      </main>
   );
}

function BookCover({
   book,
   deleteSelf,
}: {
   book: types.Summary;
   deleteSelf: () => void;
}) {
   return (
      <div className="BookCover">
         <div className="-top">
            <Menu
               label={<MoreIcon aria-hidden />}
               buttonProps={{
                  class: "Button",
                  "aria-label": "options",
                  title: "Options",
               }}
               placement="bottom-end"
            >
               <button
                  role="menuitem"
                  className="color-warning"
                  onClick={() => {
                     if (
                        window.confirm(
                           `Are you sure you want to delete "${book.title}"?`
                        )
                     )
                        deleteSelf();
                  }}
               >
                  Delete <DeleteIcon aria-hidden />
               </button>
            </Menu>
         </div>

         <Link to={"/file/" + book.id} className="-link">
            <div className="-icon">
               <BookIcon aria-hidden />
            </div>

            <h2 className="reset -title">{book.title}</h2>

            {book.subtitle && <h3 className="reset -subtitle">{book.subtitle}</h3>}

            <div className="-spacer" />

            {book.publisher && <div className="-publisher">{book.publisher}</div>}
            <div className="-spacer" />
            <div className="-pages">{book.pageCount}</div>
         </Link>
      </div>
   );
}
