// role="text" has not yet been standardised.
/* eslint-disable jsx-a11y/aria-role */

import React from "react";
import {
   Link,
   useLoaderData,
   Form,
   LoaderFunctionArgs,
   redirect,
   useNavigate,
   ScrollRestoration,
} from "react-router-dom";

import { generateURL } from "../router";
import * as db from "../db";
import * as types from "../types";
import queryClient from "../queryClient";
import { setAppState, useAppState } from "../state";
import { useTapActions } from "../util/useTapActions";
import { useMatchMedia } from "../util/useMatchMedia";

import { ReactComponent as SearchIcon } from "../icons/search.svg";
import { ReactComponent as ArrowBack } from "../icons/arrow_back.svg";
import { ReactComponent as ArrowForward } from "../icons/arrow_forward.svg";
import { ReactComponent as TOCIcon } from "../icons/toc.svg";
import { ReactComponent as CloseIcon } from "../icons/close.svg";

// import { useScrollRestoration } from "../util/useScrollRestoration";
import { Hymn } from "../components/Hymn";
import { OptionsDialog } from "../components/OptionsDialog";
import { Helmet } from "react-helmet-async";
import { useAddToHomeScreenPrompt } from "../util/useAddToHomeScreenPrompt";

export async function loader({ params }: LoaderFunctionArgs) {
   let id = Number(params.id!);
   let loc = params.loc;

   let record = await queryClient.fetchQuery(
      ["book", id, "record"],
      () => db.getBook(id),
      { staleTime: Infinity }
   );

   let allLocs = Object.keys(record.data.pages);
   let initialLoc = allLocs[0];

   if (!loc) {
      // This should only ever happen if the router is misconfigured
      throw new Response("That page doesn't exist", { status: 404 });
   }

   // If the current loc is invalid, redirect to the initial loc
   if (!allLocs.includes(loc)) {
      if (initialLoc) {
         console.error(`${loc} is an invalid loc; redirecting to loc ${initialLoc}`);
         return redirect(`/book/${id}/${initialLoc}`);
      } else throw new Response("That page doesn't exist", { status: 404 });
   }

   // Persist loc as the last-viewed loc
   setAppState(`book/${params.id}/loc`, loc);

   return {
      record,
      hymn: record.data.pages[loc]!,
   };
}

export function Component() {
   let navigate = useNavigate();

   let { record, hymn } = useLoaderData() as { record: db.BookRecord; hymn: types.Hymn };

   let isMobile = useMatchMedia("(max-width: 45em)");

   let [prevSearch] = useAppState(`book/${record.id}/search`, "");

   let searchParams = new URLSearchParams();
   if (prevSearch) searchParams.set("q", prevSearch);
   searchParams.set("loc", hymn.id);

   let setLoc = React.useCallback(
      (loc: string) => {
         navigate(generateURL({ id: record.id, loc }), { replace: true });
         hymnRef.current!.focus();
      },
      [navigate, record.id]
   );

   let allLocs = React.useMemo(() => Object.keys(record.data.pages), [record.data]);

   let nextLoc = React.useMemo(() => {
      let currentIndex = allLocs.findIndex(loc => loc === hymn.id);
      let lastIndex = allLocs.length - 1;
      return currentIndex === lastIndex ? null : allLocs[currentIndex + 1]!;
   }, [hymn.id, allLocs]);

   let prevLoc = React.useMemo(() => {
      let currentIndex = allLocs.findIndex(loc => loc === hymn.id);
      return currentIndex === 0 ? null : allLocs[currentIndex - 1]!;
   }, [hymn.id, allLocs]);

   React.useEffect(() => {
      let onKeydown = (event: KeyboardEvent) => {
         if (!hymnRef.current!.contains(event.target as HTMLElement | null)) return;
         // if (["INPUT", "TEXTAREA"].includes(document.activeElement!.nodeName)) return;

         switch (event.key) {
            case "n":
            case "ArrowRight":
               event.preventDefault();
               if (nextLoc) setLoc(nextLoc);
               break;
            case "p":
            case "ArrowLeft":
               event.preventDefault();
               if (prevLoc) setLoc(prevLoc);
               break;
         }
      };
      document.addEventListener("keydown", onKeydown);
      return () => document.removeEventListener("keydown", onKeydown);
   }, [nextLoc, prevLoc, setLoc]);

   let hymnRef = React.useRef<HTMLDivElement>(null);

   // useScrollRestoration(document, hymn.id);

   useTapActions(hymnRef, {
      left: () => {
         if (prevLoc) setLoc(prevLoc);
      },
      right: () => {
         if (nextLoc) setLoc(nextLoc);
      },
   });

   let inputRef = React.useRef<HTMLInputElement>(null);
   let [inputValue, setInputValue] = React.useState(hymn.id ?? "");

   let focusHymn = React.useCallback(
      () => hymnRef.current?.focus({ preventScroll: true }),
      []
   );

   React.useEffect(() => {
      // Submit input when the page is tapped, in lieu of a dedicated submit button
      function fn(event: TouchEvent) {
         let inputIsActive =
            document.activeElement === inputRef.current || inputValue !== hymn.id;

         if (inputIsActive && event.target !== inputRef.current) {
            navigate(`/book/${record.id}/${inputValue}`, {
               replace: true,
            });
            focusHymn();
         }
      }
      document.addEventListener("touchstart", fn);
      return () => document.removeEventListener("touchstart", fn);
   }, [navigate, record.id, hymn.id, inputValue, focusHymn]);

   // If the current hymn changes, discard unsubmitted user input
   React.useEffect(() => {
      setInputValue(hymn.id);
   }, [hymn.id]);

   let [isOptionsDialogOpen, setIsOptionsDialogOpen] = React.useState(false);

   let htmlId = React.useId();

   let searchRef = React.useRef<HTMLInputElement>(null);

   let { isPromptable, promptToInstall, isInstalled } = useAddToHomeScreenPrompt();

   return (
      <div className="Page">
         <OptionsDialog
            open={isOptionsDialogOpen}
            onClose={() => setIsOptionsDialogOpen(false)}
         />

         <Helmet>
            <title>{record.data.title}</title>
         </Helmet>

         <ScrollRestoration getKey={location => location.pathname} />

         <div className="Page-contents">
            <header className="Banner">
               <nav>
                  <div>
                     <Link to="/" title="Home">
                        Back
                     </Link>
                  </div>
               </nav>

               <h1 className="reset Banner-title Banner-title→">{record.data.title}</h1>

               <div>
                  {!isInstalled && (
                     <button
                        className="Link"
                        onClick={promptToInstall}
                        disabled={!isPromptable}
                     >
                        Install
                     </button>
                  )}
               </div>
            </header>

            <nav className="PageToolbar">
               <Link
                  to={{
                     pathname: `/book/${record.id}/search`,
                     search: "?" + searchParams,
                  }}
                  className="PageToolbar-button"
               >
                  <TOCIcon aria-hidden className="-icon" />
                  <span className="-label">Contents</span>
               </Link>

               <input
                  className="PageToolbar-input"
                  ref={inputRef}
                  name="loc"
                  type="text"
                  inputMode="decimal"
                  enterKeyHint="go"
                  value={inputValue}
                  autoComplete="off"
                  onKeyDown={e => {
                     if (e.key === "Escape" && inputValue !== hymn.id) {
                        setInputValue(hymn.id);
                        focusHymn();
                     }
                     if (e.key === "Enter") {
                        navigate(`/book/${record.id}/${inputValue}`, {
                           replace: true,
                        });
                        focusHymn();
                     }
                  }}
                  onBlur={e => {
                     if (e.target.value !== hymn.id) {
                        setInputValue(hymn.id);
                        focusHymn();
                     }
                  }}
                  onChange={e => setInputValue(e.target.value)}
                  onFocus={e => e.target.select()}
                  aria-label="page number"
               />

               <button
                  type="button"
                  className="reset PageToolbar-button"
                  onClick={() => setIsOptionsDialogOpen(!isOptionsDialogOpen)}
               >
                  <span aria-hidden className="-icon">
                     Aa
                  </span>
                  <span className="-label">Options</span>
               </button>
            </nav>

            <Hymn ref={hymnRef} record={record} hymn={hymn} />

            <Form className="SearchBar" action={`/book/${record.id}/search`}>
               <label htmlFor={htmlId + "search"} className="SearchBar-label ">
                  <SearchIcon className="SearchBar-icon" aria-label="Search icon" />
               </label>

               <input
                  type="text"
                  className="SearchBar-input"
                  id={htmlId + "search"}
                  ref={searchRef}
                  name="q"
                  aria-label="search"
                  placeholder="Search"
                  autoComplete="off"
                  inputMode="search"
                  enterKeyHint="search"
                  onFocus={e => e.target.select()}
               />

               <input type="hidden" name="loc" value={hymn.id} />

               <button
                  hidden={searchRef.current?.value.length === 0}
                  className="reset SearchBar-reset"
                  type="button"
                  aria-label="clear search"
                  onClick={() => {
                     if (searchRef.current) searchRef.current.value = "";
                  }}
               >
                  <CloseIcon aria-hidden className="SearchBar-icon" />
               </button>
            </Form>
         </div>

         {!isMobile && nextLoc && (
            <nav className="Page-nav --next">
               <Link
                  to={generateURL({ id: record.id, loc: nextLoc })}
                  aria-label="Next page"
                  onClick={focusHymn}
                  replace
               >
                  <ArrowForward aria-hidden />
               </Link>
            </nav>
         )}
         {!isMobile && prevLoc && (
            <nav className="Page-nav --prev">
               <Link
                  to={generateURL({ id: record.id, loc: prevLoc })}
                  aria-label="Previous page"
                  onClick={focusHymn}
                  replace
               >
                  <ArrowBack aria-hidden />
               </Link>
            </nav>
         )}
      </div>
   );
}
