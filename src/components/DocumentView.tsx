import React from "react";

import {useBooks} from "../context/ContextBook";
import {Hymn} from "../components/HymnFast";
// import {useDisplayOptions} from "../context/ContextDisplayOptions";
import {Search, useDocumentLocation} from "../context/ContextDocumentLocation";

export function DocumentView({id}: {id: string}) {
    // const [, setDisplayOption] = useDisplayOptions();
    const {search} = useDocumentLocation();
    const {getBook} = useBooks();
    const xmlDocument = React.useMemo(() => getBook(id), [getBook, id]);

    // React.useEffect(() => {
    //     setDisplayOption("highlight", search.text);
    // }, [search.text, setDisplayOption]);

    const allHymns = React.useMemo(
        () => [...xmlDocument.querySelectorAll("hymnal > hymns > hymn")],
        [xmlDocument]
    );

    const matchingHymnIds = React.useMemo(
        () => getHymns(xmlDocument, search),
        [search, xmlDocument]
    );

    return (
        <div className="Document">
            {search.raw && (
                <div className="Document-resultsCount">
                    {matchingHymnIds.length}{" "}
                    {matchingHymnIds.length === 1 ? "result" : "results"}
                </div>
            )}
            {allHymns.map(hymn => {
                const hymnId = hymn.getAttribute("id")!;
                return (
                    <div key={hymnId} hidden={!matchingHymnIds.includes(hymnId)}>
                        <Hymn
                            node={hymn}
                            isAboveTheFold={matchingHymnIds.slice(0, 9).includes(hymnId)}
                        />
                    </div>
                );
            })}
        </div>
    );
}

/* Search keyword examples:
    !exact
    tune:276
    author:luther
    author:"m. luther"
    author:england
    trans:juvonen
    trans:"a. juvonen"
    trans:norway
    lang:fi
    topic:heaven
    topic:"good friday"
    day:christmas
    day:2s-after-easter
  */

function getHymns(xmlDocument: XMLDocument, search: Search) {
    const predicates: string[] = [];

    for (const [keyword, value] of search.keywords) {
        switch (keyword) {
            case "topic":
                predicates.push(`[hr:topic/@ref = "${value}"]`);
                break;
            case "tune": {
                const tuneRef = xmlDocument.querySelector(
                    `hymnal > hymns > hymn[id="${value}"] tune[ref]`
                );
                const tuneID = tuneRef?.getAttribute("ref")!;
                if (tuneID) predicates.push(`[hr:tune/@ref="${tuneID}"]`);
                break;
            }
            case "day":
                predicates.push(`[hr:day/@ref = "${value}"]`);
                break;
        }
    }

    if (search.text) {
        predicates.push(`[./hr:verses/hr:verse[
                contains(
                    normalize-space(
                        translate(
                            translate(., '“”’.,;:?!-', ''),
                            'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                            'abcdefghijklmnopqrstuvwxyz'
                        )
                    ),
                    "${search.text.toLowerCase()}"
                )
            ]]`);
    }

    const result = xmlDocument.evaluate(
        `/hr:hymnal/hr:hymns/hr:hymn${predicates.join("")}/@id`,
        xmlDocument,
        nsResolver,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE
    );
    const hymns = [];
    let node;
    while ((node = result.iterateNext() as Element)) hymns.push(node.textContent);

    return hymns;
}

function nsResolver(prefix: string | null) {
    switch (prefix) {
        case "hr":
            return "hymnalreader.net";
        default:
            return null;
    }
}
