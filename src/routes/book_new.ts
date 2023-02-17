import { ActionFunctionArgs, json } from "react-router-dom";

import * as db from "../db";

export async function action({ request }: ActionFunctionArgs) {
   let formData = await request.formData();

   if (request.method.toLowerCase() === "post") {
      let promises: Promise<number>[] = [];

      for (let [key, value] of formData.entries()) {
         if (key === "url" && typeof value === "string")
            promises.push(db.createBookFromURL(value));
         else if (key === "file" && value instanceof File)
            promises.push(db.createBookFromFile(value));
      }

      let ids = await Promise.all(promises);

      return json(ids);
   }
}
