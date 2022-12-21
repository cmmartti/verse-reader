import React from "react";
import {
   Link,
   useParams,
   useRouteLoaderData,
   useSearchParams,
   LoaderFunctionArgs,
} from "react-router-dom";
import { Helmet } from "react-helmet";

import { queryClient } from "./App";
import * as bookService from "../bookService";
import { store, useAppState } from "../state";
import * as types from "../types";
import { searchIndex } from "../search";
import c from "../util/c";
import { useDebouncedCallback } from "../util/useDebouncedCallback";
import { createSelectionEditor } from "../util/createSelectionEditor";

import { NavigationBar } from "./NavigationBar";
import { Menu } from "./Menu";
import { SearchBar } from "./SearchBar";
import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { ReactComponent as ChevronIcon } from "../icons/chevron_right.svg";
import { ReactComponent as ExpandIcon } from "../icons/unfold.svg";
import { ReactComponent as CollapseIcon } from "../icons/fold.svg";

export type TReference = { id: types.HymnId; lines: string[] };
export type TCategory = {
   id: string;
   name: string | null;
   results: TReference[];
};

export type IndexState = {
   index: types.IndexType;
   sort: { [context: string]: string | undefined };
   search: string;
   expandedCategories: { [context: string]: string[] | "all" };
};

export const DEFAULT_STATE: IndexState = {
   search: "",
   index: "_none",
   sort: {},
   expandedCategories: { search: "all" },
};

export function stateToParams(state: IndexState): URLSearchParams {
   let params = new URLSearchParams();

   if (state.search) params.set("q", state.search);

   if (state.index && state.index !== "_none") params.set("groupBy", state.index);

   let sort = state.sort[state.index];
   if (sort) params.set("sort", sort);

   return params;
}

export function paramsToState(
   params: URLSearchParams,
   mergeWith: IndexState = DEFAULT_STATE
): IndexState {
   let state = { ...mergeWith };

   state.index = params.get("groupBy") ?? DEFAULT_STATE.index;
   state.search = params.get("q") ?? DEFAULT_STATE.search;
   state.sort[state.index] = params.get("sort") ?? undefined;

   return state;
}

type LoaderResponse = {
   book: types.Hymnal;
   results: { id: string; lines: string[] }[];
};

export async function loader({
   params,
   request,
}: LoaderFunctionArgs): Promise<LoaderResponse | Response> {
   let url = new URL(request.url);

   let prevState = store.getState()[`book/${params.id}/index`];
   let state = paramsToState(url.searchParams, prevState);

   store.setState(prev => ({ ...prev, [`book/${params.id}/index`]: state }));

   let book = await queryClient.fetchQuery(
      [params.id!],
      () => bookService.getBook(params.id!),
      { staleTime: Infinity }
   );

   let searchIndex = await queryClient.fetchQuery(
      [params.id!, "index"],
      () => bookService.getIndexOfLines(params.id!),
      { staleTime: Infinity }
   );

   let results = await queryClient.fetchQuery(
      [book.id, "search", state.search],
      () => searchBook(book, searchIndex, state.search),
      { staleTime: Infinity }
   );

   return { book, results };
}

function IndexPage() {


   return <BookIndex />
}

export function BookIndex() {
   let { book, results } = useRouteLoaderData("index") as LoaderResponse;

   let params = useParams<{ id: types.DocumentId; loc: types.HymnId }>();

   let [searchParams, setSearchParams] = useSearchParams();
   let setSearchParamsDebounced = useDebouncedCallback(
      (searchParams: URLSearchParams) =>
         setSearchParams(searchParams, { replace: true }),
      50,
      true
   );

   let [state, setState] = useAppState(`book/${params.id}/index`, prevState =>
      paramsToState(searchParams, prevState)
   );

   let saveState = React.useCallback(
      (action: React.SetStateAction<IndexState>) => {
         let newState = typeof action === "function" ? action(state) : action;
         setSearchParamsDebounced(stateToParams(newState));
         setState(newState);
      },
      [setSearchParamsDebounced, state, setState]
   );

   let indexOptions = React.useMemo(
      () => [
         { type: "_none", name: "Index", hasDefaultSort: true },
         ...Object.values(book.indices),
      ],
      [book]
   );

   let index =
      indexOptions.find(option => option.type === state.index) ?? indexOptions[0]!;

   let sortOptions = [
      ...(index.hasDefaultSort ? [{ id: "default", name: "Natural" }] : []),
      { id: "a-z", name: "A→Z" },
      { id: "count", name: "Count" },
   ];

   let sort =
      sortOptions.find(option => option.id === state.sort[state.index]) ??
      sortOptions[0]!;

   // Group results by category, according to the current index type
   let categories = React.useMemo(() => {
      // Explicitly defined categories
      let definedCategories: Record<string, TCategory> = {};
      for (let { id, name } of getCategories(book, index.type)) {
         definedCategories[id] = { id, name, results: [] };
      }

      // Any ad-hoc categories that don't have a referenced definition
      let adhoc: Record<string, TCategory> = {};

      // "Other" category for uncategorized results
      let other: TCategory = { id: "---", name: "(Uncategorized)", results: [] };

      // Determine to which categories each result belongs
      for (let ref of results) {
         let page = book.pages[ref.id];
         if (!page) break;
         let categoryIds = getPageCategories(index.type, page);

         if (categoryIds.length === 0) other.results.push(ref);
         for (let id of categoryIds) {
            if (definedCategories[id]) {
               definedCategories[id]!.results.push(ref);
            } else {
               adhoc[id] = adhoc[id] ?? { id, name: null, results: [] };
               adhoc[id]!.results.push(ref);
            }
         }
      }

      // Remove empty categories and put adhoc categories at the end by default
      let categories = [
         ...Object.values(definedCategories).filter(c => c.results.length > 0),
         ...Object.values(adhoc).sort((a, b) => a.id.localeCompare(b.id)),
      ];

      // If the categories aren't ordered by default, sort them alphabetically
      if (!index.hasDefaultSort || sort.id === "a-z")
         categories.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

      if (sort.id === "count")
         categories.sort((a, b) => b.results.length - a.results.length);

      // The "other" category always goes at the end
      if (other.results.length > 0) categories.push(other);

      // Use the ID as the category name if the category is un-named
      return categories.map(({ id, name, results }) => ({
         id,
         name: name ?? `[${id}]`,
         results,
      }));
   }, [book, sort, results, index]);

   let categoryKeys = React.useMemo(
      () => categories.map(category => category.id),
      [categories]
   );

   let context = state.search ? "search" : state.index;
   let visibility = state.expandedCategories[context] ?? "all";

   let getVisibility = createSelectionEditor(categoryKeys, visibility);

   let editVisibility = React.useCallback(
      (action: "select" | "deselect", items: string[] | "all") => {
         saveState(state => ({
            ...state,
            expandedCategories: {
               ...state.expandedCategories,
               [context]: getVisibility(action, items),
            },
         }));
      },
      [getVisibility, saveState, context]
   );

   let status = `${results.length} hymn${results.length !== 1 ? "s" : ""}`;
   if (index.type !== "_none") {
      status += ` in ${categories.length} categories`;
   }

   if (state.search.length > 0) {
      status = `${results.length} match${results.length !== 1 ? "es" : ""}`;
      if (index.type !== "_none" && results.length > 0) {
         status += ` in ${categories.length} categories`;
      }
   }

   let menu = (
      <Menu label={<MoreIcon />} buttonProps={{ class: "Button" }}>
         {indexOptions.map(option => (
            <button
               key={option.type}
               role="menuitemradio"
               onClick={() => saveState(state => ({ ...state, index: option.type }))}
               aria-checked={option.type === index.type}
            >
               {option.name}
            </button>
         ))}

         {index.type !== "_none" && (
            <React.Fragment>
               <div role="separator" />
               <button
                  role="menuitem"
                  onClick={() => editVisibility("select", "all")}
                  // disabled={visibility === "all"}
               >
                  Expand All <ExpandIcon aria-hidden />
               </button>
               <button
                  role="menuitem"
                  onClick={() => editVisibility("deselect", "all")}
                  // disabled={visibility.length === 0}
               >
                  Collapse All <CollapseIcon aria-hidden />
               </button>
            </React.Fragment>
         )}

         {index.type !== "_none" && (
            <React.Fragment>
               <div role="separator" />

               {sortOptions.map(option => (
                  <button
                     key={option.id}
                     role="menuitemradio"
                     onClick={() =>
                        saveState(state => ({
                           ...state,
                           sort: {
                              ...state.sort,
                              [index.type]: option.id,
                           },
                        }))
                     }
                     aria-checked={sort.id === option.id}
                  >
                     {option.name}
                  </button>
               ))}
            </React.Fragment>
         )}
      </Menu>
   );

   let resultsRef = React.useRef<HTMLDivElement>(null!);

   return (
      <main className={"BookIndex" + c("--grouped", index.type !== "_none")}>
         <Helmet>
            <title>
               {book.title} - {index.name}
            </title>
         </Helmet>

         <header className="-header">
            <NavigationBar
               back={{ to: `/file/${book.id}`, title: "Back" }}
               title={indexOptions.find(option => option.type === index.type)!.name}
               tools={menu}
            />
            <SearchBar
               value={state.search}
               onChange={value => {
                  resultsRef.current.scrollTo({ top: 0 });
                  saveState(state => {
                     // if (value)
                     //     return {
                     //         ...state,
                     //         search: value,
                     //         expandedCategories: {
                     //             ...state.expandedCategories,
                     //             search: "all",
                     //         },
                     //     };
                     return { ...state, search: value };
                  });
               }}
               onSubmit={() => resultsRef.current.focus()}
               placeholder={`Find in ${book.title} (${book.year})`}
            />
         </header>

         <div
            // key={index.id} // don't reuse this element
            className="-results"
            tabIndex={-1}
            ref={resultsRef}
         >
            <p className="status" role="status" aria-live="polite" aria-atomic="true">
               {status}
            </p>

            {index.type === "_none" ? (
               <ul className="reset ReferenceList">
                  {results.map(result => (
                     <li key={result.id}>
                        <Result
                           page={book.pages[result.id]!}
                           book={book}
                           lines={result.lines}
                           isCurrent={params.loc === result.id}
                        />
                     </li>
                  ))}
               </ul>
            ) : (
               <ul className="reset">
                  {categories.map(category => (
                     <li key={category.id}>
                        <IndexSection
                           key={category.id}
                           title={category.name}
                           current={category.results.some(
                              result => result.id === params.loc
                           )}
                           open={
                              visibility === "all" || visibility.includes(category.id)
                           }
                           onToggle={open => {
                              let items = [category.id];
                              editVisibility(open ? "select" : "deselect", items);
                           }}
                           items={category.results}
                           renderItem={({ id, lines }) => (
                              <Result
                                 page={book.pages[id]!}
                                 book={book}
                                 lines={lines}
                                 isCurrent={id === params.loc}
                              />
                           )}
                        />
                     </li>
                  ))}
               </ul>
            )}
         </div>
      </main>
   );
}

type Identifiable = { id: string };

function IndexSection<T extends Identifiable>({
   current = false,
   open = true,
   onToggle,
   title,
   items,
   renderItem,
}: {
   current?: boolean;
   open?: boolean;
   title: string;
   items: T[];
   onToggle: (open: boolean) => void;
   renderItem: (item: T) => React.ReactNode;
}) {
   return (
      <div className={"Section" + c("--open", open)}>
         <h2 className="reset -header">
            <button className="reset -button" onClick={() => onToggle(!open)}>
               {current && (
                  <span className="-marker" aria-label="contains current page" />
               )}
               <span className="-title">{title}</span>
               <span
                  className="-count"
                  aria-label={`${items.length} item${items.length !== 1 && "s"}`}
               >
                  {items.length}
               </span>
               <ChevronIcon aria-hidden className={"-arrow" + c("--rotate90", open)} />
            </button>
         </h2>

         <div className="-contents">
            <ul className="-items reset">
               {items.map(item => (
                  <li key={item.id}>{renderItem(item)}</li>
               ))}
            </ul>
         </div>
      </div>
   );
}

function Result({
   page,
   lines = [],
   isCurrent = false,
   book,
}: {
   page?: types.Hymn;
   lines?: string[];
   isCurrent?: boolean;
   book: types.Hymnal;
}) {
   if (!page) return null;

   return (
      <Link
         className={
            "ReferenceLink" +
            c("is-current", isCurrent) +
            c("is-deleted", page.isDeleted) +
            c("is-otherLanguage", page.language !== book.language)
         }
         to={`/file/${book.id}/${page.id}`}
      >
         <div className="-icon">{page.id}</div>

         <div className="-label">
            <div className="-title">
               {page.isRestricted && "*"}
               {page.title || "(no title)"}
            </div>
            <div className="-verseCount">
               {page.verses.length}&nbsp;verses
               {page.chorus && ", chorus"}
               {page.refrain && ", refrain"}
            </div>
            {/* <div className="-verseCount">
                    {page.tunes
                        .map(
                            tuneId =>
                                book.tunes?.[tuneId] ?? {
                                    id: tuneId,
                                    name: tuneId,
                                }
                        )
                        .map((tune, index) => {
                            return (
                                <React.Fragment key={tune.id}>
                                    {tune.name || tune.id}
                                    {index < page.tunes.length - 1 && ", "}
                                </React.Fragment>
                            );
                        })}
                </div> */}
         </div>

         {lines.length > 0 && (
            <ol className="-preview">
               {lines.map((line, i) => (
                  <li key={i}>{line}</li>
               ))}
            </ol>
         )}
      </Link>
   );
}

function getCategories(
   book: types.Hymnal,
   index: types.IndexType
): Array<{ id: string; name: string | null }> {
   switch (index) {
      case "_none":
         return [{ id: "_none", name: null }];
      case "topic":
         if (!book.topics) return [];
         return Object.values(book.topics);
      case "tune":
         if (!book.tunes) return [];
         return Object.values(book.tunes).map(tune => ({
            id: tune.id,
            name: tune.name || tune.id,
         }));
      case "author":
      case "translator":
         if (!book.contributors) return [];
         return Object.values(book.contributors);
      case "origin":
         if (!book.origins) return [];
         return Object.values(book.origins);
      case "days":
         if (!book.days) return [];
         return Object.values(book.days);
      case "language":
         if (!book.languages) return [];
         return Object.values(book.languages);
      default:
         return [];
   }
}

function getPageCategories(index: types.IndexType, page: types.Hymn): Array<string> {
   switch (index) {
      case "_none":
         return ["_"];
      case "topic":
         return page.topics;
      case "tune":
         return page.tunes;
      case "author":
         return page.contributors
            .filter(c => c.type === "author" && c.id)
            .map(c => c.id!);
      case "translator":
         return page.contributors
            .filter(c => c.type === "translator" && c.id)
            .map(c => c.id!);
      case "origin":
         if (page.origin) return [page.origin];
         return [];
      case "days":
         return page.days;
      case "language":
         return [page.language];
      default:
         return [];
   }
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
                     verse.lines.some(
                        lineOrRepeat =>
                           typeof lineOrRepeat !== "string" &&
                           lineOrRepeat.kind === "repeat"
                     )
                  ) ||
                  page.chorus?.lines.some(
                     lineOrRepeat =>
                        typeof lineOrRepeat !== "string" &&
                        lineOrRepeat.kind === "repeat"
                  ) ||
                  page.refrain?.lines.some(
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
