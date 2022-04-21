import React from "react";

import * as types from "../../types";
import A11yTabs from "../../util/A11yTabs";
import { Dialog } from "../Dialog";
import { SearchPanel } from "./SearchPanel";
import { IndexPanel } from "./IndexPanel";
import { ListsPanel } from "./ListsPanel";

function useA11yTabsRef() {
    let [instance, setInstance] = React.useState<A11yTabs | null>(null);

    let tablistRef = React.useCallback(node => {
        if (node !== null) setInstance(new A11yTabs(node));
    }, []);

    React.useEffect(() => {
        return () => instance?.destroy();
    }, [instance]);

    return tablistRef;
}

export function FindDialog({
    document,
    position,
}: {
    document: types.HymnalDocument | undefined;
    position: types.HymnId;
}) {
    let [isMounted, setIsMounted] = React.useState(false);
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    let tablistRef = useA11yTabsRef();

    return (
        <Dialog id="find-dialog" title="Find" className="FindDialog">
            <div role="tablist" ref={tablistRef}>
                <button
                    role="tab"
                    id="index-tab"
                    data-a11y-tabs-panel-id="index-tabpanel"
                >
                    Index
                </button>
                <button
                    role="tab"
                    id="search-tab"
                    data-a11y-tabs-panel-id="search-tabpanel"
                >
                    Search
                </button>
                <button
                    role="tab"
                    id="lists-tab"
                    data-a11y-tabs-panel-id="lists-tabpanel"
                >
                    Lists
                </button>
            </div>

            <div role="tabpanel" id="search-tabpanel" aria-labelledby="search-tab">
                {isMounted && document && (
                    <SearchPanel document={document} position={position} />
                )}
            </div>

            <div role="tabpanel" id="index-tabpanel" aria-labelledby="index-tab">
                {isMounted && document && <IndexPanel document={document} />}
            </div>

            <div role="tabpanel" id="lists-tabpanel" aria-labelledby="lists-tab">
                <ListsPanel />
            </div>
        </Dialog>
    );
}
