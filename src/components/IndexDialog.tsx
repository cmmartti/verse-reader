import React from "react";
import {Link} from "react-router-dom";

import {ReactComponent as CloseIcon} from "../assets/close_black_24dp.svg";
import {DocumentIndex} from "../HymnalDocument";

export function IndexDialog({index, backURL}: {index: DocumentIndex; backURL: string}) {
    return (
        <div className="IndexDialog-backdrop">
            <div className="IndexDialog">
                <div className="IndexDialog-header">
                    <h3 className="IndexDialog-title">{index.name}</h3>
                    <Link to={backURL} className="IndexDialog-closeButton Button">
                        <CloseIcon />
                    </Link>
                </div>
                <div className="IndexDialog-content">
                    <ul className="IndexDialog-entryList">
                        {index.entries.map(entry => (
                            <li key={entry.url}>
                                <details>
                                    <summary>
                                        {entry.name} ({entry.items.length})
                                    </summary>
                                    <Link to={`${backURL}/${entry.url}`}>View All</Link>
                                    <ul className="IndexDialog-itemList">
                                        {entry.items.map(item => (
                                            <li key={item.url}>
                                                <Link
                                                    className="IndexDialog-link"
                                                    to={item.url}
                                                >
                                                    {item.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </details>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
