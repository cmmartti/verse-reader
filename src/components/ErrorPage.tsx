import { useRouteError, Link } from "react-router-dom";

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
