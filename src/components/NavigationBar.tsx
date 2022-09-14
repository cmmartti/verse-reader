import React from "react";
import { Link } from "@tanstack/react-location";

import { ReactComponent as BackIcon } from "../icons/arrow-back-ios.svg";

export function NavigationBar({
    title,
    back,
    tools,
    search,
}: {
    title: string;
    back: {
        to: string;
        title: string;
    };
    tools?: React.ReactNode;
    search?: React.ReactNode;
}) {
    return (
        <div className="NavigationBar">
            <div className="NavigationBar-top">
                <div className="NavigationBar-back">
                    <Link className="Button" to={back.to}>
                        <BackIcon aria-hidden /> {back.title}
                    </Link>
                </div>
                <h1 className="NavigationBar-title">{title}</h1>
                <div className="NavigationBar-tools">{tools}</div>
            </div>

            {search && <div className="NavigationBar-bottom">{search}</div>}
        </div>
    );
}
