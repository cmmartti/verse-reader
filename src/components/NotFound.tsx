import * as React from "react";
import { Link } from "react-router-dom";

export function NotFound() {
    return (
        <main>
            <h1>Not Found</h1>
            <Link to="/manage">Manage Books</Link>
        </main>
    );
}
