import React from "react";
import { Form, Link, useLoaderData, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet";

import { AddDialog } from "./AddDialog";

import { ReactComponent as BookIcon } from "../icons/book.svg";
import { ReactComponent as ArrowForward } from "../icons/arrow-forward-ios.svg";
import * as types from "../types";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";

export function Home() {
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
            dispatch({ what: "stop_editing" });
            return params;
         });
      },
      [setSearchParams]
   );

   let [editState, dispatch] = React.useReducer(
      (
         state: { selected: types.DocumentId[]; mode: "edit" | "view" },
         action:
            | { what: "select"; id: types.DocumentId }
            | { what: "deselect"; id: types.DocumentId }
            | { what: "start_editing" }
            | { what: "stop_editing" }
      ) => {
         switch (action.what) {
            case "select":
               if (!state.selected.includes(action.id))
                  return { ...state, selected: [...state.selected, action.id] };
               return state;
            case "deselect":
               return {
                  ...state,
                  selected: state.selected.filter(id => action.id !== id),
               };
            case "start_editing":
               return { ...state, mode: "edit" as const, selected: [] };
            case "stop_editing":
               return { ...state, mode: "view" as const, selected: [] };
         }
         return state;
      },
      { selected: [], mode: "view" }
   );

   return (
      <main className="Home">
         <Helmet>
            <title>Hymnal - Library</title>
         </Helmet>
         <div className="-header">
            <h1 className="reset -title">Library</h1>
            {editState.mode === "view" && list.length > 0 && (
               <button
                  className="Button"
                  onClick={() => dispatch({ what: "start_editing" })}
               >
                  Edit
               </button>
            )}

            {editState.mode === "edit" && (
               <Form
                  method="delete"
                  onSubmit={() => dispatch({ what: "stop_editing" })}
                  className="display-contents"
               >
                  {editState.selected.map(id => (
                     <input key={id} type="hidden" name="id" value={id} />
                  ))}
                  <button
                     type="submit"
                     className="Button color-warning"
                     disabled={editState.selected.length === 0}
                  >
                     Delete
                  </button>
               </Form>
            )}

            {editState.mode === "edit" && (
               <button
                  className="Button"
                  onClick={() => dispatch({ what: "stop_editing" })}
               >
                  <b>Done</b>
               </button>
            )}
         </div>

         <div className="section">
            {editState.mode === "view" &&
               list.map(book => (
                  <Link key={book.id} to={"/" + book.id}>
                     <BookIcon />
                     <div style={{ display: "flex", flexFlow: "column" }}>
                        {book.title} {book.year && `(${book.year})`}
                        <span className="subdued">{book.publisher}</span>
                     </div>
                     <span className="spacer" />
                     <ArrowForward />
                  </Link>
               ))}

            {editState.mode === "view" && list.length === 0 && (
               <div className="subdued">Empty</div>
            )}

            {editState.mode === "edit" &&
               list.map(book => (
                  <label key={book.id}>
                     <input
                        className="reset"
                        type="checkbox"
                        checked={editState.selected.includes(book.id)}
                        onChange={e =>
                           dispatch({
                              what: e.target.checked ? "select" : "deselect",
                              id: book.id,
                           })
                        }
                     />
                     <BookIcon />
                     <div style={{ display: "flex", flexFlow: "column" }}>
                        {book.title} {book.year && `(${book.year})`}
                        <span className="subdued">{book.publisher}</span>
                     </div>
                     <span className="spacer" />
                  </label>
               ))}

            {/* {(editState.mode === "edit" || list.length === 0) && (
                )} */}
            <button className="section-button" onClick={() => toggleDialog(true)}>
               Add books
            </button>
         </div>

         {!isInstalled && (
            <div className="section">
               <button
                  className="section-button"
                  onClick={promptToInstall}
                  disabled={!isPromptable}
               >
                  Install to Home Screen
               </button>
            </div>
         )}

         <AddDialog open={isDialogOpen} onClose={() => toggleDialog(false)} />
      </main>
   );
}
