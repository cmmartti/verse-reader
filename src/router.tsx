import { createBrowserRouter } from "react-router-dom";

import * as library from "./routes/library";
import * as page from "./routes/page";
import * as bookIndex from "./routes/book";
import * as book_new from "./routes/book_new";
import * as search from "./routes/search";

import { ErrorPage } from "./components/ErrorPage";

export default createBrowserRouter([
   {
      path: "/",
      loader: library.loader,
      element: <library.Component />,
      errorElement: <ErrorPage />,
   },
   {
      path: "/book",
      errorElement: <ErrorPage />,
      children: [
         { path: "new", action: book_new.action },
         {
            path: ":id",
            action: bookIndex.action,
            loader: bookIndex.loader,
         },
         {
            id: "page",
            path: ":id/:loc",
            loader: page.loader,
            element: <page.Component />,
         },
         {
            path: ":id/search",
            loader: search.loader,
            element: <search.Component />,
         },
      ],
   },
]);

export function generateURL({
   id,
   loc,
   search,
}: {
   id: number | string;
   loc?: string;
   search?: string;
}) {
   let url = `/book/${id}`;

   if (search) {
      url += `/search?q=${encodeURIComponent(search)}`;
      if (loc) url += `&loc=${loc}`;
      return url;
   }

   if (loc) url += `/${loc}`;
   return url;
}
