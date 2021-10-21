import React from "react";
import {ReactRenderer} from "xml-renderer";
import * as fontoxpath from "fontoxpath";

const rules = new ReactRenderer();
rules.add("self::text()", ({node}) => <>{node.nodeValue}</>);
rules.add("self::node()", ({traverse}) => <>{traverse()}</>);
rules.add("self::hymns", ({traverse}) => (
    <div className="Document">{traverse("./hymn")}</div>
));
rules.add("self::hymn", ({traverse, node}) => {
    const id = fontoxpath.evaluateXPathToString("@id", node);
    return (
        <div id={id} data-id={id}>
            <div className="Hymn">
                <header className="Hymn-header">
                    <div className="Hymn-number">{id}</div>
                    <div className="Hymn-tunes">Tune: {traverse("./tune")}</div>
                </header>
                <div className="Hymn-verses">
                    {traverse("./verses/verse[1]")}
                    {traverse("./verses/refrain")}
                    {traverse("./verses/chorus")}
                    {traverse("./verses/verse[position() > 1]")}
                </div>
            </div>
        </div>
    );
});
rules.add("self::tune", ({traverse, node}) => {
    const id = fontoxpath.evaluateXPathToString("@ref", node);
    const name = fontoxpath.evaluateXPathToString(
        `/hymnal/tunes//tune[@id="${id}"]/@name`,
        node
    );
    return <>{name}</>;
});
rules.add("self::verse", ({traverse, node}) => {
    const verseNumber =
        fontoxpath.evaluateXPathToNumber(`count(preceding-sibling::verse)`, node) + 1;
    const hasChorus = fontoxpath.evaluateXPathToBoolean(
        "preceding-sibling::chorus",
        node
    );
    const hasRefrain = fontoxpath.evaluateXPathToBoolean(
        "preceding-sibling::refrain",
        node
    );
    return (
        <p>
            {verseNumber}. {traverse("./line|repeat")}
            {hasChorus && (
                <>
                    {" "}
                    <i>Chorus:</i>
                </>
            )}
            {hasRefrain && (
                <>
                    {" "}
                    <i>Chorus:</i>
                </>
            )}
        </p>
    );
});
rules.add("self::line", ({traverse, node}) => (
    <span className="Hymn-line">{traverse()}</span>
));
rules.add("self::repeat", ({traverse, node}) => (
    <span className="Hymn-repeat">
        {traverse("./line")}
        <span className="Hymn-repeatMarker">
            (x{fontoxpath.evaluateXPathToString("@times", node) || "2"})
        </span>
    </span>
));
rules.add("self::chorus", ({traverse}) => (
    <p className="Hymn-chorus">
        <i>Chorus:</i> {traverse("./line|repeat")}
    </p>
));
rules.add("self::refrain", ({traverse}) => (
    <p className="Hymn-refrain">
        <i>Refrain:</i> {traverse("./line|repeat")}
    </p>
));

export function Document({document}: {document: XMLDocument}) {
    return <>{rules.render(React.createElement, document)}</>;
}
