// role="text" has not yet been standardised.
/* eslint-disable jsx-a11y/aria-role */

import React from "react";
import { Helmet } from "react-helmet-async";
import {
   Link,
   useLoaderData,
   Form,
   LoaderFunctionArgs,
   ActionFunctionArgs,
   redirect,
   Outlet,
   useRouteLoaderData,
} from "react-router-dom";

import * as db from "../db";
import * as types from "../types";
import queryClient from "../queryClient";
import { store, useAppState } from "../state";
import { useMatchMedia } from "../util/useMatchMedia";

import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";
import { ReactComponent as SearchIcon } from "../icons/search.svg";
import { OptionsDialog } from "../components/OptionsDialog";
import { DEFAULT_STATE } from "./book.$id.$loc_.search";

export async function loader({ params, request }: LoaderFunctionArgs) {
   let id = Number(params.id!);
   let loc = params.loc;

   let searchParams = new URL(request.url).searchParams;
   if (searchParams.get("loc"))
      return redirect(`/book/${id}/${searchParams.get("loc")}`);

   let record = await queryClient.fetchQuery(
      ["book", id, "record"],
      () => db.getBook(id),
      { staleTime: Infinity }
   );

   let allLocs = Object.keys(record.data.pages);
   let initialLoc = allLocs[0];

   // If no loc is set, redirect to the last-viewed loc, or the initialLoc
   if (!loc) {
      let lastViewedLoc = store.getState()[`book/${params.id}/loc`];
      let fallbackLoc = lastViewedLoc ?? initialLoc;
      if (fallbackLoc) return redirect(`/book/${id}/${fallbackLoc}`);
   }

   return record;
}

export async function action({ request, params }: ActionFunctionArgs) {
   if (!params.id) throw new Response("", { status: 404 });

   switch (request.method.toLowerCase()) {
      case "delete":
         await db.deleteBook(Number(params.id));
         return redirect("/");
   }
}

export function Component() {
   let record = useLoaderData() as db.BookRecord;
   let pageLoaderData = useRouteLoaderData("page") as
      | { record: db.BookRecord; hymn: types.Hymn }
      | undefined;

   let isMobile = useMatchMedia("(max-width: 29rem)");
   let [isOptionsDialogOpen, setIsOptionsDialogOpen] = React.useState(false);

   let [prevSearchState] = useAppState(`book/${record.id}/index`, DEFAULT_STATE);

   let searchParams = new URLSearchParams();
   if (prevSearchState.search) searchParams.set("q", prevSearchState.search);
   if (pageLoaderData) searchParams.set("loc", pageLoaderData.hymn.id);

   return (
      <main className="Book">
         <OptionsDialog
            open={isOptionsDialogOpen}
            onClose={() => setIsOptionsDialogOpen(false)}
         />

         <Helmet>
            <title>{record.data.title}</title>
         </Helmet>

         <header className="-header">
            <nav className="-back">
               <Link className="Button" to="/" aria-label="back to library">
                  <BackIcon aria-hidden />
                  {!isMobile && "Home"}
               </Link>
            </nav>

            <div className="-title">
               <h1 className="-contents">{record.data.title}</h1>
            </div>

            {!isMobile && (
               <nav className="-tools">
                  <Link
                     className="Button"
                     aria-label="Search"
                     to={{
                        pathname: `/book/${record.id}/search`,
                        search: "?" + searchParams,
                     }}
                  >
                     <SearchIcon aria-hidden />
                  </Link>
                  <button
                     className={"Button" + (isOptionsDialogOpen ? " --active" : "")}
                     aria-label="options"
                     onClick={() => setIsOptionsDialogOpen(isOpen => !isOpen)}
                  >
                     <b aria-hidden>Aa</b>
                  </button>
               </nav>
            )}
         </header>

         <Outlet />

         {/* <Form action={`/book/${record.id}/search`} className="-search">
            {pageLoaderData && (
               <input type="hidden" name="loc" value={pageLoaderData.hymn.id} />
            )}
            <input
               type="search"
               name="q"
               className="-input"
               placeholder="Search"
               autoComplete="off"
            />
            <Link
               to={{
                  pathname: `/book/${record.id}/search`,
                  search: "?" + searchParams,
               }}
               className="-input"
            >
               Search
            </Link>
         </Form> */}

         {isMobile && (
            <div className="-bottombar">
               <nav className="-contents">
                  <Link
                     className="Button"
                     aria-label="Search"
                     to={{
                        pathname: `/book/${record.id}/search`,
                        search: "?" + searchParams,
                     }}
                  >
                     <SearchIcon aria-hidden />
                  </Link>

                  <button
                     className="Button"
                     aria-label="options"
                     title="Options"
                     onClick={() => setIsOptionsDialogOpen(isOpen => !isOpen)}
                  >
                     <b aria-hidden>Aa</b>
                  </button>
               </nav>
            </div>
         )}
      </main>
   );
}
