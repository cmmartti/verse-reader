import {
   createBrowserRouter,
   RouterProvider,
   useRouteError,
   redirect,
   Link,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { Helmet } from "react-helmet";

import * as bookService from "../bookService";
import { store } from "../state";

import { BookIndex, loader as findLoader } from "./BookIndex";
import { BookOptions } from "./BookOptions";
import { Home } from "./Home";
import { Book } from "./Book";
import { OptionsProvider } from "../options";

export const queryClient = new QueryClient();

const router = createBrowserRouter([
   {
      path: "/",
      element: <Home />,
      errorElement: <ErrorPage />,
      loader: () => bookService.getAllSummaries(),
      action: async ({ request }) => {
         let formData = await request.formData();
         if (request.method === "DELETE") {
            for (let id of formData.getAll("id") as string[]) {
               bookService.deleteBook(id);
            }
         }
      },
   },
   {
      path: "/:id",
      errorElement: <ErrorPage />,
      children: [
         {
            index: true,
            loader: async ({ params }) => {
               let { initialPage } = await bookService.getSummary(params.id!);
               let loc = store.getState()[`book/${params.id}/loc`] ?? initialPage;
               if (loc) return redirect(`/${params.id}/${loc}`);
            },
            // element: <EmptyBook />,
         },
         {
            path: ":loc",
            id: "book",
            loader: async ({ params }) => {
               let book = await bookService.getBook(params.id!);

               // If the current loc is invalid, redirect to the initial loc
               let locs = Object.values(book.pages).map(page => page.id);
               if (!locs.includes(params.loc!)) {
                  let initialLoc = locs[0];
                  if (initialLoc) return redirect(`/${params.id}/${initialLoc}`);
                  else throw new Error("404 Not Found");
               }

               // Persist the last-visited loc
               store.setState(prev => ({
                  ...prev,
                  [`book/${params.id}/loc`]: params.loc,
               }));

               return book;
            },
            children: [
               { index: true, element: <Book /> },
               { path: "options", element: <BookOptions /> },
               {
                  path: "index",
                  id: "index",
                  element: <BookIndex />,
                  loader: findLoader,
               },
            ],
         },
      ],
   },
]);

export const App = () => (
   <QueryClientProvider client={queryClient}>
      <Helmet>
         <meta name="theme-color" content="#f4f4f4" />
         <title>Hymnal</title>
      </Helmet>
      <OptionsProvider>
         <RouterProvider router={router} />
      </OptionsProvider>
   </QueryClientProvider>
);

export function ErrorPage() {
   const error = useRouteError();
   console.error(error);
   return (
      <div id="error-page">
         <h1>Error</h1>
         <p>An unexpected error has occurred.</p>
         <p>{error instanceof Error ? error.message : String(error)}</p>
         <p>
            <Link to="/">Return to Library</Link>
         </p>
      </div>
   );
}
