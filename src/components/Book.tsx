import React from "react";
import { Link, useParams, useRouteLoaderData, useNavigate } from "react-router-dom";
import { useFullscreen } from "rooks";

import * as types from "../types";
import { ReactComponent as CloseIcon } from "../icons/close.svg";
import { ReactComponent as TOCIcon } from "../icons/toc.svg";
import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";
import { ReactComponent as ForwardIcon } from "../icons/arrow-forward-ios.svg";

import { useTapActions } from "../util/useTapActions";
import { Hymn } from "./Hymn";
import { useMatchMedia } from "../util/useMatchMedia";
import { NavigationBar } from "./NavigationBar";
import { useAppState } from "../state";
import { DEFAULT_STATE, stateToParams } from "./BookIndex";
import { Helmet } from "react-helmet";
import { Menu } from "./Menu";

export function Book() {
   let navigate = useNavigate();

   let file = useRouteLoaderData("book") as types.Hymnal;
   let params = useParams() as { id: types.DocumentId; loc: types.HymnId };

   let locs = React.useMemo(
      () => Object.values(file.pages).map(page => page.id),
      [file]
   );

   let setLoc = React.useCallback(
      (loc: string) => {
         navigate(`/file/${params.id!}/${loc}`, { replace: true });
         canvasRef.current!.focus();
      },
      [navigate, params.id]
   );

   let currentLocRef = React.useRef(params.loc!);
   React.useEffect(() => {
      currentLocRef.current = params.loc!;
   });

   let nextLoc = React.useMemo(() => {
      let currentIndex = locs.findIndex(loc => loc === params.loc);
      return locs[Math.min(locs.length - 1, currentIndex + 1)]!;
   }, [params.loc, locs]);

   let prevLoc = React.useMemo(() => {
      let currentIndex = locs.findIndex(loc => loc === params.loc);
      return locs[Math.max(0, currentIndex - 1)]!;
   }, [params.loc, locs]);

   React.useEffect(() => {
      let fn = (event: KeyboardEvent) => {
         if (!canvasRef.current!.contains(event.target as HTMLElement | null)) return;

         switch (event.key) {
            case "n":
            case "ArrowRight":
               event.preventDefault();
               setLoc(nextLoc);
               break;
            case "p":
            case "ArrowLeft":
               event.preventDefault();
               setLoc(prevLoc);
               break;
         }
      };
      document.addEventListener("keydown", fn);
      return () => document.removeEventListener("keydown", fn);
   }, [nextLoc, prevLoc, setLoc]);

   // Store the scroll position ratio of this loc on each scroll event
   let scrollPositions = React.useRef(new Map<string, number>());
   React.useEffect(() => {
      let el = document.documentElement;
      let fn = () => {
         let position = el.scrollTop / el.clientHeight; // scroll ratio 0..1
         scrollPositions.current.set(currentLocRef.current, position);
      };
      document.addEventListener("scroll", fn);
      return () => document.removeEventListener("scroll", fn);
   }, []);

   // When the loc changes, revert the previously-stored scroll position
   React.useLayoutEffect(() => {
      let el = document.documentElement;
      el.scrollTop = (scrollPositions.current.get(params.loc!) ?? 0) * el.clientHeight;
   }, [params.loc]);

   let canvasRef = React.useRef<HTMLDivElement>(null!);
   let appRef = React.useRef<HTMLElement>(null!);
   let isMobile = useMatchMedia("(max-width: 29rem)");

   let [isExpanded, setIsExpanded] = React.useState(false);
   // let { toggleFullscreen } = useFullscreen();

   useTapActions(canvasRef, {
      left: () => setLoc(prevLoc),
      right: () => setLoc(nextLoc),
      middle: () => {
         setIsExpanded(val => !val);
         // toggleFullscreen();
      },
   });

   let input = (
      <NumberInput
         value={params.loc}
         onSubmit={value => setLoc(value)}
         onEnter={() => canvasRef.current.focus()}
         onForward={() => setLoc(nextLoc)}
         onBack={() => setLoc(prevLoc)}
      />
   );

   let [lastIndexState] = useAppState(`book/${params.id}/index`, DEFAULT_STATE);
   let indexLink = (
      <Link
         className="Button"
         aria-label="index"
         title="Index"
         to={"index?" + stateToParams(lastIndexState)}
      >
         <TOCIcon />
         {/* Index */}
      </Link>
   );

   let optionsLink = (
      <Link className="Button" aria-label="appearance" title="Appearance" to={"options"}>
         Aa
      </Link>
   );

   let menu = (
      <Menu
         label={<MoreIcon />}
         buttonProps={{ class: "Button" }}
         placement="bottom-end"
      >
         <button role="menuitem" onClick={() => {}}>
            Mark as Sung
         </button>
         <button role="menuitemcheckbox" aria-checked={true} onClick={() => {}}>
            Show Notes
         </button>
         <div role="separator" />
         <button role="menuitem" onClick={() => {}}>
            Favourites
         </button>
         <button role="menuitem" onClick={() => {}}>
            History
         </button>
      </Menu>
   );

   return (
      <main className={"Book" + (isExpanded ? " --fullscreen" : "")} ref={appRef}>
         <Helmet>
            <title>{file.title}</title>
         </Helmet>

         {!isExpanded && (
            <header className="-header">
               <NavigationBar
                  back={{ to: "/", title: "Library" }}
                  title={file.title}
                  tools={
                     !isMobile && (
                        <React.Fragment>
                           {input}
                           {indexLink}
                           {optionsLink}
                        </React.Fragment>
                     )
                  }
               />
            </header>
         )}

         <div className="-contents">
            <div className="-canvas" ref={canvasRef} tabIndex={-1}>
               <Hymn key={params.loc} hymn={file.pages[params.loc!]!} book={file} />
            </div>
         </div>

         {isMobile && !isExpanded && (
            <div className="-bottombar">
               <div className="-contents">
                  {indexLink}
                  {input}
                  {optionsLink}
               </div>
            </div>
         )}
      </main>
   );
}

function NumberInput({
   value,
   onEnter,
   onSubmit,
   disabled = false,
   max,
   onForward,
   onBack,
}: {
   value: types.HymnId;
   onSubmit: (value: string) => void;
   onEnter: () => void;
   disabled?: boolean;
   max?: number;
   onForward?: () => void;
   onBack?: () => void;
}) {
   let inputRef = React.useRef<HTMLInputElement>(null!);

   let [inputValue, setInputValue] = React.useState(value);

   // If the value changes, discard unsubmitted user input
   React.useEffect(() => {
      setInputValue(value ?? "");
   }, [value]);

   // Submit when the page is clicked, in lieu of a dedicated submit button
   // React.useEffect(() => {
   //    function fn(event: Event) {
   //       if (event.target === inputRef.current) return;
   //       if (inputValue) onSubmit(inputValue);
   //       else setInputValue(value);
   //    }
   //    window.addEventListener("click", fn);
   //    return () => window.removeEventListener("click", fn);
   // }, [inputValue, onSubmit, value]);

   return (
      <form
         className="AddressBar"
         onSubmit={e => {
            e.preventDefault();
            if (inputValue) {
               onSubmit(inputValue);
               onEnter();
            } else setInputValue(value);
         }}
      >
         <input
            ref={inputRef}
            disabled={disabled}
            type="text"
            inputMode="decimal"
            enterKeyHint="go"
            value={inputValue}
            onKeyDown={e => {
               if (e.key === "Escape") {
                  setInputValue(value);
                  onEnter();
               }
            }}
            onFocus={e => e.target.select()}
            onChange={event => setInputValue(event.target.value)}
            aria-label="page number"
            max={max}
            min="1"
         />
      </form>
   );
}
