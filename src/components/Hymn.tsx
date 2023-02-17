// role="text" has not yet been standardised.
/* eslint-disable jsx-a11y/aria-role */

import React from "react";
import { Link } from "react-router-dom";

import * as db from "../db";
import { generateURL } from "../router";
import * as types from "../types";
import { Verses } from "./Verses";

export let Hymn = React.forwardRef(
   (
      { record, hymn }: { record: db.BookRecord; hymn: types.Hymn },
      ref: React.ForwardedRef<HTMLElement>
   ) => {
      let contributors = hymn.contributors.map(({ type, id, year, note }) => {
         let name = (id ? record.data.contributors?.[id]?.name : null) ?? id;
         return { type, id, name, year, note };
      });
      let authors = contributors.filter(c => c.type === "author");
      let translators = contributors.filter(c => c.type === "translator");

      let getURL = (search: string) =>
         generateURL({
            id: record.id,
            loc: hymn.id,
            search,
         });

      return (
         <article
            className={"Hymn" + (hymn.isDeleted ? " --deleted" : "")}
            ref={ref}
            tabIndex={-1}
         >
            <h2 className="visually-hidden">
               Page {hymn.id}. {hymn.title}
               {hymn.isDeleted && ", removed"}
               {hymn.isRestricted && ", not for church services"}
            </h2>

            {hymn.topics.length > 0 && (
               <div className="Hymn-topics">
                  {/* {`Topic${hymn.topics.length > 1 ? "s" : ""}: `} */}
                  {hymn.topics
                     .map(id => record.data.topics?.[id] ?? { id, name: id })
                     .map((topic, i) => (
                        <React.Fragment key={topic.id}>
                           <Link
                              to={generateURL({
                                 id: record.id,
                                 loc: hymn.id,
                                 search: `#topic=${topic.id}`,
                              })}
                           >
                              <span className="visually-hidden" role="text">
                                 Topic:{" "}
                              </span>
                              {topic.name}
                           </Link>
                           {i < hymn.topics.length - 1 && " + "}
                        </React.Fragment>
                     ))}
               </div>
            )}

            <section className="Hymn-verses" lang={hymn.language}>
               <Verses hymn={hymn} />
            </section>

            <section className="Hymn-details">
               <div>
                  <div>Full Title</div>
                  <div lang={hymn.language}>{hymn.title}</div>
               </div>

               {hymn.language !== record.data.language && (
                  <div>
                     <div>Language</div>
                     <div>
                        <Link to={getURL(`#lang=${hymn.language}`)}>
                           {record.data.languages[hymn.language]?.name ?? hymn.language}
                        </Link>
                     </div>
                  </div>
               )}

               {hymn.tunes.length > 0 && (
                  <div>
                     <div>Tune{hymn.tunes.length > 1 && "s"}</div>
                     <div>
                        {hymn.tunes.map(id => (
                           <div key={id}>
                              <Link to={getURL(`#tune=${id}`)}>
                                 {record.data.tunes?.[id]?.name || id}
                              </Link>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {authors.length > 0 && (
                  <div>
                     <div>Author{authors.length > 1 && "s"}</div>
                     <div>
                        {authors.map(({ name, note, year, id }, i) => (
                           <div key={i}>
                              <Link to={getURL(`#author=${id}`)}>{name}</Link>
                              {note && ` (${note})`}
                              {year && ` (${year})`}
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {hymn.origin && (
                  <div>
                     <div>Origin</div>
                     <div>
                        <Link to={getURL(`#origin=${hymn.origin}`)}>
                           {record.data.origins?.[hymn.origin]?.name ?? hymn.origin}
                        </Link>
                     </div>
                  </div>
               )}

               {translators.length > 0 && (
                  <div>
                     <div>Translator{translators.length > 1 && "s"}</div>
                     <div>
                        {translators.map(({ name, note, year, id }, i) => (
                           <div key={i}>
                              <Link to={getURL(`#transl=${id}`)}>{name}</Link>
                              {note && ` (${note})`}
                              {year && ` (${year})`}
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {hymn.links.length > 0 && (
                  <div>
                     <div>Elsewhere</div>
                     <div>
                        {hymn.links.map(link => (
                           <div key={link.edition}>
                              {link.edition} #{link.id}
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {hymn.days.length > 0 && (
                  <div>
                     <div>Suggested Use</div>
                     <div>
                        {hymn.days.map(id => (
                           <div key={id}>
                              <Link to={getURL(`#day=${id}`)}>
                                 {record.data.days?.[id]?.name ?? id}
                              </Link>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {hymn.isRestricted && (
                  <div>
                     <div>* Note</div>
                     <div>
                        <Link to={getURL("#restricted")}>Not for church services</Link>;
                        may be used for other occasions.
                     </div>
                  </div>
               )}

               {hymn.isDeleted && (
                  <div>
                     <div>** Note</div>
                     <div>
                        <Link to={getURL("#deleted")}>
                           This page was removed from a later printing of this book.
                        </Link>
                     </div>
                  </div>
               )}
            </section>
         </article>
      );
   }
);
