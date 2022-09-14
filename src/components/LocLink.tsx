import { Link, LinkProps } from "@tanstack/react-location";

import * as types from "../types";

export function LocLink({
    bookId,
    loc,
    q,
    ...rest
}: LinkProps & {
    bookId: types.DocumentId;
    loc: types.HymnId;
    q: string;
}) {
    return <Link {...rest} />;
}
