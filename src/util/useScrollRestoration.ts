import React from "react";

export function useScrollRestoration(
   elementOrDocument: HTMLElement | Document,
   id: string
) {
   let scrollPositions = React.useRef(new Map<string, number>());

   let idRef = React.useRef(id);
   React.useEffect(() => {
      idRef.current = id;
   });

   let element =
      elementOrDocument instanceof Document
         ? elementOrDocument.documentElement
         : elementOrDocument;

   // Store the scroll position ratio of this id on each scroll event
   React.useEffect(() => {
      function fn() {
         let position = element.scrollTop / element.clientHeight; // scroll ratio 0..1
         scrollPositions.current.set(idRef.current!, position);
      }

      elementOrDocument.addEventListener("scroll", fn);
      return () => elementOrDocument.removeEventListener("scroll", fn);
   }, [elementOrDocument, element]);

   // When the id changes, revert the previously-stored scroll position, if it exists
   React.useLayoutEffect(() => {
      element.scrollTop = (scrollPositions.current.get(id!) ?? 0) * element.clientHeight;
   }, [id, element]);
}
