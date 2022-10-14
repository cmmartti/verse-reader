import React from "react";
import { Link } from "react-router-dom";

import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";

export function NavigationBar({
    title,
    back,
    tools,
}: {
    title: string;
    back: {
        to: string;
        title: string;
    };
    tools?: React.ReactNode;
}) {
    return (
        <div className="NavigationBar">
            <div className="NavigationBar-back">
                <Link className="Button" to={back.to}>
                    <BackIcon aria-hidden /> {back.title}
                </Link>
            </div>
            <h1 className="NavigationBar-title">{title}</h1>
            <div className="NavigationBar-tools">{tools}</div>
        </div>
    );
}
