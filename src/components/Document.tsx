import React from "react";
import {Link} from "react-router-dom";

import {getDocument} from "../util/documentRepository";
import {HymnalDocument} from "../HymnalDocument";
import {Hymn} from "./Hymn";

export function Document({
    id,
    search,
    setPage,
}: {
    id: string;
    search: string;
    setSearch: (search: string) => void;
    page: string;
    setPage: (page: string) => void;
}) {
    const hymnalDocument = React.useMemo(
        () => new HymnalDocument(getDocument(id).unwrap()),
        [id]
    );

    const documentRef = React.useRef<HTMLDivElement>(null!);

    React.useEffect(() => {
        // An IntersectionObserver only reports what's *changed*, so keep a list
        const intersectionRatios: {[id: string]: number} = {};

        const observer = new IntersectionObserver(
            entries => {
                // Update the current intersectionRatio of each entry
                entries.forEach(entry => {
                    const id = entry.target.getAttribute("data-id");
                    if (id) intersectionRatios[id] = entry.intersectionRatio;
                });

                let main: string | null = null;
                Object.entries(intersectionRatios).forEach(([id, ratio]) => {
                    if (!main) main = id;
                    else if (intersectionRatios[main] < ratio) main = id;
                });
                if (main) setPage(main);
            },
            {
                root: documentRef.current,
                threshold: [0, 0.25, 0.75, 1],
            }
        );

        [...documentRef.current.children].forEach(item => {
            observer.observe(item);
        });

        return () => observer.disconnect();
    }, []);

    const allHymns = React.useMemo(() => hymnalDocument.getHymns(), [hymnalDocument]);
    const matchingHymns = React.useMemo(
        () => hymnalDocument.getHymns(search),
        [search, hymnalDocument]
    );

    return (
        <div className="Document" ref={documentRef}>
            <div>
                {search && (
                    <>
                        <p>
                            {matchingHymns.length}{" "}
                            {matchingHymns.length === 1 ? "result" : "results"}. Scroll
                            right to view →
                        </p>
                        <p>
                            <Link to={`/${id}`}>Clear search</Link>
                        </p>
                    </>
                )}
                <ul>
                    {matchingHymns.map(hymn => (
                        <li key={hymn.getAttribute("id")}>
                            {hymn.getAttribute("id")}.{" "}
                            <a href={`#${hymn.getAttribute("id")}`}>
                                {hymn.querySelector("title")?.textContent}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            {allHymns.map(hymn => (
                <div
                    key={hymn.getAttribute("id")!}
                    data-id={hymn.getAttribute("id")}
                    hidden={!matchingHymns.includes(hymn)}
                >
                    <Hymn
                        node={hymn}
                        isAboveTheFold={matchingHymns.slice(0, 9).includes(hymn)}
                    />
                </div>
            ))}
        </div>
    );
}
