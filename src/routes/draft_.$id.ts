import { ActionFunctionArgs } from "react-router-dom";

import * as db from "../db";

export async function action({ request, params }: ActionFunctionArgs) {
   if (!params.id) throw new Response("", { status: 404 });

   if (request.method.toLowerCase() === "delete") {
      db.deleteBook(Number(params.id));
   }
}
