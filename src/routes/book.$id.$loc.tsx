// role="text" has not yet been standardised.
/* eslint-disable jsx-a11y/aria-role */

import React from "react";
import {
   Link,
   useLoaderData,
   Form,
   useSubmit,
   LoaderFunctionArgs,
   redirect,
   useNavigate,
} from "react-router-dom";

import { generateURL } from "../router";
import * as db from "../db";
import * as types from "../types";
import queryClient from "../queryClient";
import { store } from "../state";
import { useTapActions } from "../util/useTapActions";
import { useMatchMedia } from "../util/useMatchMedia";

import { ReactComponent as ArrowBack } from "../icons/arrow_back.svg";
import { ReactComponent as ArrowForward } from "../icons/arrow_forward.svg";
import { useScrollRestoration } from "../util/useScrollRestoration";
import { Hymn } from "../components/Hymn";

export async function loader({ params, request }: LoaderFunctionArgs) {
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
   store.setState(prev => ({ ...prev, [`book/${params.id}/loc`]: loc }));

   return {
      record,
      hymn: record.data.pages[loc]!,
   };
}

export function Component() {
   let navigate = useNavigate();

   let { record, hymn } = useLoaderData() as { record: db.BookRecord; hymn: types.Hymn };

   let linkToSearch = `/book/${record.id}/search?loc=${hymn.id}`;
   let isMobile = useMatchMedia("(max-width: 29rem)");

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
   }, [nextLoc, prevLoc, setLoc, linkToSearch]);

   let hymnRef = React.useRef<HTMLDivElement>(null!);

   useScrollRestoration(document, hymn.id ?? "");

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

   return (
      <div className="Page">
         <div className="-contents">
            <nav className="-goTo">
               <input
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
                  title="Go to"
               />
            </nav>

            <Hymn ref={hymnRef} record={record} hymn={hymn} />
         </div>

         {!isMobile && nextLoc && (
            <nav className="-nav --next">
               <Link
                  to={generateURL({ id: record.id, loc: nextLoc })}
                  aria-label="Next page"
                  onClick={() => hymnRef.current.focus()}
                  replace
               >
                  <ArrowForward aria-hidden />
               </Link>
            </nav>
         )}
         {!isMobile && prevLoc && (
            <nav className="-nav --prev">
               <Link
                  to={generateURL({ id: record.id, loc: prevLoc })}
                  aria-label="Previous page"
                  onClick={() => hymnRef.current.focus()}
                  replace
               >
                  <ArrowBack aria-hidden />
               </Link>
            </nav>
         )}
      </div>
   );
}
