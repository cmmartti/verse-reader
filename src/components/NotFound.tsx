import React from "react";
import { Link, useMatch } from "@tanstack/react-location";

export function NotFound() {
    let { error } = useMatch();

    return (
        <main>
            <h1>Error</h1>
            {error && <p>{(error as any).toString()}</p>}
            <hr />
            <p>
                <Link to="/manage">Manage Books</Link>
            </p>
        </main>
    );
}
