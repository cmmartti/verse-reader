import { createBrowserRouter } from "react-router-dom";

import * as home from "./routes/home";
import * as draft from "./routes/draft";
import * as draft_new from "./routes/draft_.new";
import * as draft_id from "./routes/draft_.$id";
import * as book from "./routes/book.$id.$loc";
import * as bookIndex from "./routes/book.$id";
import * as book_new from "./routes/book_.new";
import * as search from "./routes/book.$id.$loc_.search";
// import * as options from "./routes/book.$id.options";

import { ErrorPage } from "./components/ErrorPage";

export default createBrowserRouter([
   {
      path: "/",
      loader: home.loader,
      element: <home.Component />,
      errorElement: <ErrorPage />,
   },
   {
      path: "/draft",
      loader: draft.loader,
      action: draft.action,
      errorElement: <ErrorPage />,
      element: <draft.Component />,
      children: [
         { path: "new", action: draft_new.action },
         { path: ":id", action: draft_id.action },
      ],
   },
   {
      path: "/book",
      errorElement: <ErrorPage />,
      children: [
         { path: "new", action: book_new.action },
         {
            path: ":id",
            loader: bookIndex.loader,
            action: bookIndex.action,
            element: <bookIndex.Component />,
            children: [
               {
                  id: "page",
                  path: ":loc",
                  loader: book.loader,
                  element: <book.Component />,
               },
            ],
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
