import * as React from "react";

import {HymnalDocument} from "../HymnalDocument";

// function groupHymns(
//     document: HymnalDocument,
//     groupBy: string,
//     hymns: Element[]
// ): {name: string; hymns: Element[]}[] {
//     switch (groupBy) {
//         case "topic":
//             return ;
//     }
// }

export function Index({hymns, document}: {hymns: Element[]; document: HymnalDocument}) {
    const [groupBy, setGroupBy] = React.useState("topic");

    return (
        <div className="Index">
            <div>
                <label htmlFor="groupBy-select">Group by:</label>
                <select
                    id="groupBy-select"
                    value={groupBy}
                    onChange={e => setGroupBy(e.target.value)}
                >
                    <option value="none">(None)</option>
                    <option value="topic">Topic</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="tune">Tune</option>
                    <option value="author">Author</option>
                    <option value="translator">Translator</option>
                    <option value="origin">Origin</option>
                    <option value="language">Language</option>
                </select>
            </div>
            <ul className="Index-list">
                {hymns.map(hymn => {
                    const id = hymn.getAttribute("id");
                    const isDeleted = [1, "true"].includes(
                        hymn.getAttribute("deleted") ?? 0
                    );
                    const isRestricted = [1, "true"].includes(
                        hymn.getAttribute("restricted") ?? 0
                    );
                    const language = hymn.getAttribute("language") ?? document.language;
                    return (
                        <li
                            key={id}
                            className={`Index-entry${isDeleted ? " is-deleted" : ""}${
                                language !== document.language ? " is-otherLanguage" : ""
                            }`}
                        >
                                <span className="Index-entryNumber">{id}:</span>{" "}
                            <a className="Index-entryTitle" href={`#${id}`}>
                                {isRestricted && "*"}
                                {hymn.querySelector("title")?.textContent ||
                                    "(no title)"}
                            </a>
                        </li>
                    );
                })}
            </ul>
            <hr />
            <p>*This hymn should not be sung during church services.</p>
            <p>
                A <span style={{textDecoration: "line-through"}}>strikethrough</span>{" "}
                indicates that this hymn was removed in a later printing of this edition.
            </p>
        </div>
    );
}
