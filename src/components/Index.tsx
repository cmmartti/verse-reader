import * as React from "react";

import {HymnalDocument} from "../HymnalDocument";

export function Index({hymns, document}: {hymns: Element[]; document: HymnalDocument}) {
    return (
        <div className="Index">
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
                            {isRestricted && "*"}
                            {id}.{" "}
                            <a href={`#${id}`}>
                                {hymn.querySelector("title")?.textContent}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
