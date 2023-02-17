import React from "react";
import { Form, useSubmit } from "react-router-dom";

import * as db from "../db";
import * as types from "../types";
import { Index, Result } from "../routes/search";
import { IndexEntry } from "./IndexEntry";
import { IndexGroup } from "./IndexGroup";
import { ReactComponent as ExpandMoreIcon } from "../icons/expand_more.svg";
import { useAppState } from "../state";
import { createSelectionReducer } from "../util/createSelectionReducer";
import { pluralize } from "../util/pluralize";

export type ResultCategory = { id: string; name: string | null; results: Result[] };

export function SearchResultsGrouped({
   results,
   record,
   currentLoc,
   search,
   clearSearchLink,
   searchInput,
   index,
}: {
   results: Result[];
   record: db.BookRecord;
   currentLoc: string | null;
   search: string;
   clearSearchLink: React.ReactNode;
   searchInput: React.ReactNode;
   index: Index;
}) {
   let submit = useSubmit();
   let htmlId = React.useId();

   let categories = React.useMemo(() => {
      // An orphan category is one without a definition (no name, etc.)
      let orphanCategoriesMap: Record<string, ResultCategory> = {};
      let uncategorized: Result[] = [];
      let categoriesMap = Object.fromEntries(
         getCategories(record.data, index.type).map(({ id, name }) => [
            id,
            { id, name, results: [] as Result[] },
         ])
      );

      // Determine to which categories each result belongs
      for (let result of results) {
         let page = record.data.pages[result.id];
         if (!page) break;
         let categoryIds = getPageCategories(index.type, page);

         if (categoryIds.length === 0) uncategorized.push(result);
         for (let id of categoryIds) {
            let category = categoriesMap[id];
            if (category) category.results.push(result);
            else {
               let category = orphanCategoriesMap[id];
               if (!category) {
                  category = { id, name: null, results: [] };
                  orphanCategoriesMap[id] = category;
               }
               category.results.push(result);
            }
         }
      }

      let categories = [
         ...Object.values(categoriesMap).filter(category => category.results.length > 0),
         ...Object.values(orphanCategoriesMap).sort((a, b) => a.id.localeCompare(b.id)),
      ];

      // If the categories aren't naturally ordered, sort them alphabetically
      if (!index.hasDefaultSort || index.sort.id === "name")
         categories.sort((a, b) => (a.name ?? a.id).localeCompare(b.name ?? b.id));

      if (index.sort.id === "count")
         categories.sort((a, b) => b.results.length - a.results.length);

      // Always put uncategorized results at the end in their own category
      if (uncategorized.length > 0) {
         categories = [
            ...categories,
            {
               id: "_",
               name: "(Uncategorized)",
               results: uncategorized,
            },
         ];
      }

      return categories;
   }, [results, index.type, index.sort.id, index.hasDefaultSort, record.data]);

   let formRef = React.useRef<HTMLFormElement>(null);
   React.useEffect(() => {
      let form = formRef.current;

      function fn() {
         submit(form);
         document.documentElement.scrollTo({ top: 0 });
      }

      form?.addEventListener("change", fn);
      return () => form?.removeEventListener("change", fn);
   }, [submit]);

   let context = search ? `${index.type}+search` : index.type;

   let [expandedGroups, _setExpandedGroups] = useAppState(
      `book/${record.id}/index/${context}/expandedGroups`,
      "all"
   );

   let selectionReducer = React.useMemo(
      () =>
         createSelectionReducer(
            categories.map(category => category.id),
            expandedGroups
         ),
      [categories, expandedGroups]
   );

   let setExpandedGroups = React.useCallback(
      (action: "select" | "deselect", items: string[] | "all") => {
         _setExpandedGroups(selectionReducer(action, items));
      },
      [selectionReducer, _setExpandedGroups]
   );

   return (
      <div className="SearchResults">
         <Form className="SearchResults-sidebar" replace ref={formRef}>
            <div className="SearchResults-sidebarGroup">
               {record.data.title}{" "}
               <b role="status" aria-live="polite" aria-atomic="true">
                  {results.length} {pluralize(search ? "match" : "page", results.length)}
                  {search && ` for “${search}”`}
               </b>
               {clearSearchLink}
            </div>

            <div className="SearchResults-sidebarGroup">
               <b role="status" aria-live="polite" aria-atomic="true">
                  {categories.length} {pluralize("category", categories.length)}
               </b>

               <label>
                  Sort By:{" "}
                  {/* <select className="reset Select" name="sort">
                     {index.sortOptions.map(option => (
                        <option
                           key={option.id}
                           value={option.id}
                           selected={index.sort.id === option.id}
                        >
                           {option.name}
                        </option>
                     ))}
                  </select> */}
                  <h-select for={htmlId + "sort"} class="Select" placement="bottom">
                     <h-selectlabel />
                     <ExpandMoreIcon aria-hidden className="Select-icon" />
                  </h-select>
               </label>

               <span className="SearchResults-sidebarPair">
                  <button
                     type="button"
                     className="Link"
                     onClick={() => {
                        setExpandedGroups("select", "all");
                        document.documentElement.scrollTo({ top: 0 });
                     }}
                     // disabled={visibility === "all"}
                  >
                     Expand All
                  </button>

                  <button
                     type="button"
                     className="Link"
                     onClick={() => {
                        setExpandedGroups("deselect", "all");
                        document.documentElement.scrollTo({ top: 0 });
                     }}
                     // disabled={visibility.length === 0}
                  >
                     Collapse All
                  </button>
               </span>
            </div>

            {search && <input type="hidden" name="q" value={search} />}
            <input type="hidden" name="group" value={index.type} />

            <h-listbox id={htmlId + "sort"} name="sort" class="ListBox">
               {index.sortOptions.map(option => (
                  <h-option
                     key={option.id}
                     value={option.id}
                     selected={index.sort === option ? "" : undefined}
                  >
                     {option.name}
                  </h-option>
               ))}
            </h-listbox>

            {currentLoc && <input type="hidden" name="loc" value={currentLoc ?? ""} />}
         </Form>

         <div className="SearchResults-main">
            <ol
               className="reset SearchResults-categories SearchResults-results"
               role="list"
            >
               {categories.map(category => (
                  <li key={category.id}>
                     <IndexGroup
                        key={category.id}
                        title={category?.name ?? `[${category.id}]`}
                        current={category.results.some(
                           result => result.id === currentLoc
                        )}
                        open={
                           expandedGroups === "all" ||
                           expandedGroups.includes(category.id)
                        }
                        onToggle={open => {
                           setExpandedGroups(open ? "select" : "deselect", [
                              category.id,
                           ]);
                        }}
                        length={category.results.length}
                     >
                        <ol className="reset">
                           {category.results.map(result => (
                              <li key={result.id}>
                                 <IndexEntry
                                    url={`/book/${record.id}/${result.id}`}
                                    page={record.data.pages[result.id]!}
                                    book={record.data}
                                    lines={result.lines}
                                    isCurrent={result.id === currentLoc}
                                 />
                              </li>
                           ))}
                        </ol>
                     </IndexGroup>
                  </li>
               ))}
            </ol>

            <div className="SearchResults-search">{searchInput}</div>
         </div>
      </div>
   );
}

function getCategories(
   book: types.Hymnal,
   index: types.IndexType
): Array<{ id: string; name: string | null }> {
   switch (index) {
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
