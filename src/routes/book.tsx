import { LoaderFunctionArgs, ActionFunctionArgs, redirect } from "react-router-dom";

import * as db from "../db";
import queryClient from "../queryClient";
import { getAppState } from "../state";

export async function loader({ params, request }: LoaderFunctionArgs) {
   let id = Number(params.id!);
   let loc = params.loc;

   let searchParams = new URL(request.url).searchParams;
   if (searchParams.get("loc"))
      return redirect(`/book/${id}/${searchParams.get("loc")}`);

   let record = await queryClient.fetchQuery(
      ["book", id, "record"],
      () => db.getBook(id),
      { staleTime: Infinity }
   );

   let allLocs = Object.keys(record.data.pages);
   let initialLoc = allLocs[0];

   // If no loc is set, redirect to the last-viewed loc, or the initialLoc
   if (!loc) {
      let lastViewedLoc = getAppState(`book/${params.id}/loc`);
      let fallbackLoc = lastViewedLoc ?? initialLoc;
      if (fallbackLoc) return redirect(`/book/${id}/${fallbackLoc}`);
   }

   return record;
}

export async function action({ request, params }: ActionFunctionArgs) {
   if (!params.id) throw new Response("", { status: 404 });

   switch (request.method.toLowerCase()) {
      case "delete":
         await db.deleteBook(Number(params.id));
         return redirect("/");
   }
}
