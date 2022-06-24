import React from "react";

import { ReactComponent as ChevronIcon } from "../icons/chevron_right.svg";

export function Accordion({ children }: { children?: React.ReactNode }) {
    return <div>{children}</div>;
}

export function AccordionSection({
    children,
    label,
}: {
    children?: React.ReactNode;
    label: React.ReactNode;
}) {
    let id = React.useId();
    return (
        <div className="AccordionSection">
            <h2 id={id}>
                <button>
                    <ChevronIcon aria-hidden className="openIndicator" />
                    {label}
                </button>
            </h2>
            <div id="collapseOne" aria-labelledby={id}>
                {children}
            </div>
        </div>
    );
}
