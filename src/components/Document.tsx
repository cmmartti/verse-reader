import React from "react";
import {Link} from "react-router-dom";

import {HymnalDocument} from "../HymnalDocument";
import {Hymn} from "./Hymn";
import {Index} from "./Index";

export function Document({
    document,
    search,
    setPage,
}: {
    document: HymnalDocument;
    search: string;
    setPage: (page: string) => void;
}) {
    const documentRef = React.useRef<HTMLDivElement>(null!);

    React.useEffect(() => {
        // An IntersectionObserver only reports what's *changed*, so keep a list
        const intersectionRatios: {[id: string]: number} = {};

        const observer = new IntersectionObserver(
            entries => {
                // Update each entry's intersectionRatio
                entries.forEach(entry => {
                    const id = entry.target.getAttribute("data-id");
                    if (id) intersectionRatios[id] = entry.intersectionRatio;

                    // If an entry is now out of the viewport, scroll the
                    // entry's own vertical scroll location back to the top.
                    // TODO: needs to be more intelligent
                    if (entry.intersectionRatio === 0) entry.target.scrollTo(0, 0);
                });

                // Find the left-most page that has the highest intersection ratio
                const activePage = Object.entries(intersectionRatios)
                    .map(([id, ratio]) => ({id, ratio}))
                    .reduce((prev, cur) => (cur.ratio > prev.ratio ? cur : prev));
                if (activePage) setPage(activePage.id);
            },
            {
                root: documentRef.current,
                threshold: [0, 0.5, 1],
            }
        );

        [...documentRef.current.children].forEach(item => {
            observer.observe(item);
        });

        return () => observer.disconnect();
    }, [setPage]);

    const allHymns = React.useMemo(() => document.getHymns(), [document]);
    const matchingHymns = React.useMemo(
        () => document.getHymns(search),
        [search, document]
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
                            <Link to={`/${document.id}`}>Clear search</Link>
                        </p>
                    </>
                )}
                <Index document={document} hymns={matchingHymns} />
            </div>

            {allHymns.map(hymn => (
                <div
                    key={hymn.getAttribute("id")!}
                    data-id={hymn.getAttribute("id")}
                    hidden={!matchingHymns.includes(hymn)}
                    tabIndex={-1}
                >
                    <Hymn
                        node={hymn}
                        documentLanguage={document.language}
                        isAboveTheFold={matchingHymns.slice(0, 9).includes(hymn)}
                    />
                </div>
            ))}
        </div>
    );
}
