import React from "react";
import {
   Link,
   useSearchParams,
   LoaderFunctionArgs,
   useLoaderData,
   Form,
   useSubmit,
   useNavigation,
   ScrollRestoration,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import lunr from "lunr";

import * as db from "../db";
import queryClient from "../queryClient";
import { getAppState, setAppState } from "../state";
import * as types from "../types";
import { searchIndex } from "../search";

import { ReactComponent as CloseIcon } from "../icons/close.svg";
import { ReactComponent as SearchIcon } from "../icons/search.svg";
import { ReactComponent as ExpandMoreIcon } from "../icons/expand_more.svg";
import { SearchResults } from "../components/SearchResults";
import { SearchResultsGrouped } from "../components/SearchResultsGrouped";

export type Index = {
   type: string;
   name: string;
   hasDefaultSort: boolean;
   sort: { id: string; name: string };
   sortOptions: { id: string; name: string }[];
};

export async function loader({ params, request }: LoaderFunctionArgs) {
   let url = new URL(request.url);
   let id = Number(params.id!);

   let record = await queryClient.fetchQuery(
      ["book", id, "record"],
      () => db.getBook(id),
      { staleTime: Infinity }
   );

   let lunrIndex = await queryClient.fetchQuery(
      ["book", id, "index"],
      () => lunr.Index.load(record.lunrIndex),
      { staleTime: Infinity }
   );

   let indexType =
      url.searchParams.get("group") ?? getAppState(`book/${id}/index`) ?? null;

   let indexOptions: Index[] = [
      ...Object.values(record.data.indices).map(index => {
         let sortOptions = [
            ...(index.hasDefaultSort ? [{ id: "default", name: "Default" }] : []),
            { id: "name", name: "Name" },
            { id: "count", name: "Count" },
         ];

         let currentSortId =
            (indexType === index.type ? url.searchParams.get("sort") : null) ??
            getAppState(`book/${id}/index/${index.type}/sort`) ??
            null;

         return {
            type: index.type,
            name: index.name,
            hasDefaultSort: index.hasDefaultSort,
            sort: sortOptions.find(sort => sort.id === currentSortId) ?? sortOptions[0]!,
            sortOptions,
         };
      }),
   ];

   let index = indexOptions.find(index => index.type === indexType);
   let search = url.searchParams.get("q") ?? "";

   // Persist these settings to local storage
   setAppState(`book/${id}/index`, index?.type ?? null);
   if (index) setAppState(`book/${id}/index/${index.type}/sort`, index.sort.id);
   setAppState(`book/${id}/search`, search);

   let results = await queryClient.fetchQuery(
      ["book", id, "search", search],
      () => searchBook(record.data, lunrIndex, search),
      { staleTime: Infinity }
   );

   return { record, results, search, indexOptions, index };
}

export type Result = { id: string; lines: string[] };
export type ResultCategory = { id: string; name: string | null; results: Result[] };

export function Component() {
   let { record, results, search, index, indexOptions } = useLoaderData() as {
      record: db.BookRecord;
      results: Result[];
      search: string;
      indexOptions: Index[];
      index: Index | null;
   };

   // let [searchParams] = useSearchParams();
   // let currentLoc = searchParams.get("loc");
   let currentLoc = null;

   let htmlId = React.useId();

   let submit = useSubmit();

   let selectFormRef = React.useRef<HTMLFormElement>(null);
   React.useEffect(() => {
      let form = selectFormRef.current;

      function fn() {
         submit(form);
         document.documentElement.scrollTo({ top: 0 });
      }

      form?.addEventListener("change", fn);
      return () => form?.removeEventListener("change", fn);
   }, [submit]);

   let resetSearchParams = new URLSearchParams();
   if (index) {
      resetSearchParams.set("group", index.type);
      if (index.sort) resetSearchParams.set("sort", index.sort.id);
   }
   if (currentLoc) resetSearchParams.set("loc", currentLoc);
   let resetSearchURL = `/book/${record.id}/search?${resetSearchParams}`;

   let searchInputRef = React.useRef<HTMLInputElement>(null);
   let searchFormRef = React.useRef<HTMLFormElement>(null);

   let navigation = useNavigation();

   // Clear the search input whenever the search is cleared
   React.useEffect(() => {
      if (navigation.state === "loading") {
         let searchParams = new URLSearchParams(navigation.location.search);
         if (!searchParams.get("q")) {
            if (searchInputRef.current) searchInputRef.current.value = "";
            // document.documentElement.scrollTo({ top: 0 });
         }
      }
   }, [navigation]);

   let clearSearchLink = search ? (
      <Link replace to={resetSearchURL} className="Link">
         Clear search
      </Link>
   ) : null;

   let searchBar = (
      <Form
         className="SearchBar"
         ref={searchFormRef}
         onSubmit={() => {
            // statusRef.current.focus({ preventScroll: true });
            document.documentElement.scrollTo({ top: 0 });
         }}
         onChange={e => submit(e.currentTarget)}
         replace
      >
         <label
            className="SearchBar-label SearchBar-label→icon"
            htmlFor={htmlId + "search"}
         >
            <SearchIcon className="SearchBar-icon" aria-label="Search icon" />
         </label>

         <input
            className="SearchBar-input"
            type="text"
            id={htmlId + "search"}
            ref={searchInputRef}
            name="q"
            defaultValue={search}
            aria-label="search"
            placeholder="Search"
            autoComplete="off"
            inputMode="search"
            enterKeyHint="search"
            onFocus={e => e.target.select()}
            onChange={() => submit(searchFormRef.current)}
         />

         {index && <input type="hidden" name="group" value={index.type} />}
         {index && <input type="hidden" name="sort" value={index.sort.id} />}
         {currentLoc && <input type="hidden" name="loc" value={currentLoc} />}

         <Link
            replace
            to={resetSearchURL}
            className="reset hide-focus SearchBar-reset SearchBar-reset→icon"
            hidden={searchInputRef.current?.value.length === 0}
            aria-label="Clear search"
         >
            <CloseIcon aria-hidden className="SearchBar-icon" />
         </Link>
      </Form>
   );

   return (
      <main className="Search">
         <Helmet>
            <title>
               {record.data.title} - {index ? index.name : "Contents"}
            </title>
         </Helmet>

         <ScrollRestoration getKey={location => location.pathname} />

         <header className="Banner Banner--sticky">
            <nav>
               <Link to={`/book/${record.id}`}>Back</Link>
            </nav>

            {indexOptions.length === 0 ? (
               <h1 className="reset Banner-title Banner-title→">Contents</h1>
            ) : (
               <Form className="Banner-title→" ref={selectFormRef} replace>
                  {search && <input type="hidden" name="q" value={search} />}

                  <h1 className="reset Banner-title">
                     <h-select for={htmlId + "select"} class="Select" placement="bottom">
                        <h-selectlabel>{index ? index.name : "Contents"}</h-selectlabel>
                        <ExpandMoreIcon aria-hidden className="Select-icon" />
                     </h-select>
                  </h1>

                  <h-listbox id={htmlId + "select"} name="group" class="ListBox">
                     <h-option value="" selected={!index ? "" : undefined}>
                        Contents
                     </h-option>

                     {indexOptions.map(option => (
                        <h-option
                           key={option.type}
                           value={option.type}
                           selected={option === index ? "" : undefined}
                        >
                           {option.name}
                        </h-option>
                     ))}
                  </h-listbox>

                  {currentLoc && <input type="hidden" name="loc" value={currentLoc} />}
               </Form>
            )}

            <Link to={`/book/${record.id}`}>Help</Link>
         </header>

         {!index ? (
            <SearchResults
               results={results}
               record={record}
               currentLoc={currentLoc}
               search={search}
               clearSearchLink={clearSearchLink}
               searchInput={searchBar}
            />
         ) : (
            <SearchResultsGrouped
               results={results}
               record={record}
               currentLoc={currentLoc}
               search={search}
               clearSearchLink={clearSearchLink}
               searchInput={searchBar}
               index={index}
            />
         )}
      </main>
   );
}

type Filter = { type: string; value: string | undefined };

function searchBook(book: types.Hymnal, indexOfLines: lunr.Index, search: string) {
   let searchTerms: string[] = [];
   let filters: Filter[] = [];

   search
      .trim()
      .split(" ")
      .filter(Boolean)
      .forEach(term => {
         if (term[0] === "#") {
            let [type, value] = term.slice(1).split("=", 2);
            filters.push({ type: type!, value });
         } else searchTerms.push(term);
      });

   let results = [] as { id: string; lines: string[] }[];

   if (searchTerms.length > 0) {
      results = searchIndex(indexOfLines, book, searchTerms);
   } else {
      results = Object.keys(book.pages).map(id => ({ id, lines: [] }));
   }

   for (let { type, value } of filters) {
      results = results.filter(result => {
         let page = book.pages[result.id];
         if (!page) return false;

         switch (type) {
            case "topic":
               return value ? page.topics.includes(value) : page.topics.length > 0;
            case "day":
               return value ? page.days.includes(value) : page.days.length > 0;
            case "tune":
               return value ? page.tunes.includes(value) : page.tunes.length > 0;
            case "origin":
               return value ? page.origin === value : !!page.origin;
            case "lang":
               return value ? page.language === value : true;
            case "deleted":
               return page.isDeleted;
            case "restricted":
               return page.isRestricted;
            case "author": {
               let authors = page.contributors
                  .filter(c => c.type === "author")
                  .map(c => c.id);
               return value ? authors.includes(value) : authors.length > 0;
            }
            case "transl": {
               let translators = page.contributors
                  .filter(c => c.type === "translator")
                  .map(c => c.id);
               return value ? translators.includes(value) : translators.length > 0;
            }
            case "refrain":
               return value === "yes" || value === undefined
                  ? !!page.refrain
                  : !page.refrain;
            case "chorus":
               return value === "yes" || value === undefined
                  ? !!page.chorus
                  : !page.chorus;
            case "repeat": {
               let hasRepeat =
                  page.verses.some(verse =>
                     verse.nodes.some(
                        lineOrRepeat =>
                           typeof lineOrRepeat !== "string" &&
                           lineOrRepeat.kind === "repeat"
                     )
                  ) ||
                  page.chorus?.nodes.some(
                     lineOrRepeat =>
                        typeof lineOrRepeat !== "string" &&
                        lineOrRepeat.kind === "repeat"
                  ) ||
                  page.refrain?.nodes.some(
                     lineOrRepeat =>
                        typeof lineOrRepeat !== "string" &&
                        lineOrRepeat.kind === "repeat"
                  );

               return value === "yes" || value === undefined ? !!hasRepeat : !hasRepeat;
            }
            default:
               return true;
         }
      });
   }

   return results;
}
