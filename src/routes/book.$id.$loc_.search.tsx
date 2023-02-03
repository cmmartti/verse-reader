import React from "react";
import {
   Link,
   useParams,
   useSearchParams,
   LoaderFunctionArgs,
   useLoaderData,
} from "react-router-dom";
import { Helmet } from "react-helmet-async";
import lunr from "lunr";

import * as db from "../db";
import queryClient from "../queryClient";
import { IndexState, store, useAppState } from "../state";
import * as types from "../types";
import { searchIndex } from "../search";
import { useDebouncedCallback } from "../util/useDebouncedCallback";
import { createSelectionEditor } from "../util/createSelectionEditor";

import { SearchBar } from "../components/SearchBar";
import { ReactComponent as MoreIcon } from "../icons/more_vert.svg";
import { ReactComponent as ChevronIcon } from "../icons/chevron_right.svg";
import { ReactComponent as ExpandIcon } from "../icons/unfold.svg";
import { ReactComponent as CollapseIcon } from "../icons/fold.svg";
import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";
import { useMatchMedia } from "../util/useMatchMedia";
import { useOption } from "../options";

let c = (cls: string, inc: boolean) => (inc ? " " + cls : "");

export const DEFAULT_STATE: IndexState = {
   search: "",
   index: "_none",
   sort: {},
   expandedCategories: { search: "all" },
};

export function stateToParams(state: IndexState): URLSearchParams {
   let params = new URLSearchParams();

   if (state.search) params.set("q", state.search);
   if (state.index) params.set("groupBy", state.index);

   let sort = state.sort[state.index];
   if (sort) params.set("sort", sort);

   return params;
}

export function paramsToState(
   params: URLSearchParams,
   mergeWith: IndexState = DEFAULT_STATE
): IndexState {
   let index = params.get("groupBy") ?? mergeWith.index ?? DEFAULT_STATE.index;

   let state = {
      ...mergeWith,
      index,
      search: params.get("q") ?? DEFAULT_STATE.search,
      sort: {
         ...mergeWith.sort,
         [index]: params.get("sort") ?? mergeWith.sort[index] ?? undefined,
      },
   };

   return state;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
   let url = new URL(request.url);

   let id = Number(params.id!);

   let prevState = store.getState()[`book/${id}/index`];
   let state = paramsToState(url.searchParams, prevState);

   store.setState(prev => ({ ...prev, [`book/${id}/index`]: state }));

   let record = await queryClient.fetchQuery(
      ["book", id, "record"],
      () => db.getBook(id),
      { staleTime: Infinity }
   );

   let index = await queryClient.fetchQuery(
      ["book", id, "index"],
      () => lunr.Index.load(record.lunrIndex),
      { staleTime: Infinity }
   );

   let results = await queryClient.fetchQuery(
      ["book", id, "search", state.search],
      () => searchBook(record.data, index, state.search),
      { staleTime: Infinity }
   );

   return { record, results };
}

export type ResultCategory = {
   id: string;
   name: string | null;
   results: {
      id: types.HymnId;
      lines: string[];
   }[];
};

export function Component() {
   let isMobile = useMatchMedia("(max-width: 29rem)");

   let { record, results } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

   let params = useParams<{ id: string }>();

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
         ...Object.values(record.data.indices),
      ],
      [record.data]
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
      let definedCategories: Record<string, ResultCategory> = {};
      for (let { id, name } of getCategories(record.data, index.type)) {
         definedCategories[id] = { id, name, results: [] };
      }

      // Any ad-hoc categories that don't have a referenced definition
      let adhoc: Record<string, ResultCategory> = {};

      // "Other" category for uncategorized results
      let other: ResultCategory = { id: "---", name: "(Uncategorized)", results: [] };

      // Determine to which categories each result belongs
      for (let ref of results) {
         let page = record.data.pages[ref.id];
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

      // Use "[ID]" as the category name if the category is un-named
      return categories.map(({ id, name, results }) => ({
         id,
         name: name ?? `[${id}]`,
         results,
      }));
   }, [record.data, sort, results, index]);

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

   let resultsRef = React.useRef<HTMLDivElement>(null!);

   let htmlId = React.useId();

   let [showSearchResultDetails, setShowSearchResultDetails] = useOption(
      "showSearchResultDetails"
   );

   let menu = (
      <h-menu id={htmlId + "menu"} class="Menu">
         {indexOptions.map(option => (
            <h-menuitem
               key={option.type}
               type="radio"
               checked={option.type === index.type ? "" : null}
               onClick={() => saveState(state => ({ ...state, index: option.type }))}
            >
               {option.name}
            </h-menuitem>
         ))}

         {index.type !== "_none" && (
            <>
               <div role="separator" />
               <h-menuitem
                  type="button"
                  onClick={() => editVisibility("select", "all")}
                  disabled={visibility === "all" ? "" : null}
               >
                  Expand All <ExpandIcon aria-hidden />
               </h-menuitem>
               <h-menuitem
                  type="button"
                  onClick={() => editVisibility("deselect", "all")}
                  disabled={visibility.length === 0 ? "" : null}
               >
                  Collapse All <CollapseIcon aria-hidden />
               </h-menuitem>
            </>
         )}

         {index.type !== "_none" && (
            <>
               <div role="separator" />
               {sortOptions.map(option => (
                  <h-menuitem
                     key={option.id}
                     type="radio"
                     checked={sort.id === option.id ? "" : null}
                     onClick={() =>
                        saveState(state => ({
                           ...state,
                           sort: {
                              ...state.sort,
                              [index.type]: option.id,
                           },
                        }))
                     }
                  >
                     {option.name}
                  </h-menuitem>
               ))}
            </>
         )}

         <div role="separator" />
         <h-menuitem
            type="radio"
            checked={showSearchResultDetails ? "" : null}
            onClick={() => setShowSearchResultDetails(!showSearchResultDetails)}
         >
            Show Details
         </h-menuitem>
      </h-menu>
   );

   return (
      <main className={"BookIndex" + c("--grouped", index.type !== "_none")}>
         <Helmet>
            <title>
               {record.data.title} - {index.name}
            </title>
         </Helmet>

         <header className="-header">
            <div className="NavigationBar">
               <div className="-back">
                  <Link className="Button" to={`/book/${record.id}`} aria-label="Back">
                     <BackIcon aria-hidden />
                     {!isMobile && "Back"}
                  </Link>
               </div>
               <div className="-title">
                  <h1 className="-contents">
                     {indexOptions
                        .find(option => option.type === index.type)!
                        .name.toUpperCase()}
                  </h1>
               </div>
               <div className="-tools">
                  <h-menubutton
                     class="Button"
                     for={htmlId + "menu"}
                     aria-owns={htmlId + "menu"}
                     eat-dismiss-clicks=""
                     aria-label="menu"
                  >
                     <MoreIcon aria-hidden />
                  </h-menubutton>
                  {menu}
               </div>
            </div>

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
               placeholder={`Find in ${record.data.title} (${record.data.year})`}
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
                           url={`/book/${record.id}/${result.id}`}
                           page={record.data.pages[result.id]!}
                           book={record.data}
                           lines={result.lines}
                           isCurrent={searchParams.get("loc") === result.id}
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
                              result => result.id === searchParams.get("loc")
                           )}
                           open={
                              visibility === "all" || visibility.includes(category.id)
                           }
                           onToggle={open => {
                              let items = [category.id];
                              editVisibility(open ? "select" : "deselect", items);
                           }}
                           items={category.results}
                           renderItem={result => (
                              <Result
                                 url={`/book/${record.id}/${result.id}`}
                                 page={record.data.pages[result.id]!}
                                 book={record.data}
                                 lines={result.lines}
                                 isCurrent={result.id === searchParams.get("loc")}
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
   url,
   page,
   lines = [],
   isCurrent = false,
   book,
}: {
   url: string;
   page?: types.Hymn;
   lines?: string[];
   isCurrent?: boolean;
   book: types.Hymnal;
}) {
   let [showSearchResultDetails] = useOption("showSearchResultDetails");

   if (!page) return null;

   return (
      <Link
         className={
            "ReferenceLink" +
            c("is-current", isCurrent) +
            c("is-deleted", page.isDeleted) +
            c("is-otherLanguage", page.language !== book.language)
         }
         to={url}
      >
         <div className="-icon">{page.id}</div>

         <div className="-label">
            <div className="-title">
               {page.isRestricted && "*"}
               {page.title || "(no title)"}
            </div>
            {showSearchResultDetails && (
               <div className="-verseCount">
                  {page.verses.length}&nbsp;verses
                  {page.chorus && ", chorus"}
                  {page.refrain && ", refrain"}
               </div>
            )}
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
