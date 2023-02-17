import React from "react";

export function useScrollRestoration(
   elementOrDocument: HTMLElement | Document,
   key: string
) {
   let scrollPositions = React.useRef(new Map<string, number>());

   let idRef = React.useRef(key);
   React.useEffect(() => {
      idRef.current = key;
   });

   let element =
      elementOrDocument instanceof Document
         ? elementOrDocument.documentElement
         : elementOrDocument;

   // Store the scroll position ratio of this key on each scroll event
   React.useEffect(() => {
      function fn() {
         let position = element.scrollTop / element.clientHeight; // scroll ratio 0..1
         scrollPositions.current.set(idRef.current!, position);
      }

      elementOrDocument.addEventListener("scroll", fn);
      return () => elementOrDocument.removeEventListener("scroll", fn);
   }, [elementOrDocument, element]);

   // When the key changes, revert the previously-stored scroll position, if it exists
   React.useLayoutEffect(() => {
      element.scrollTop =
         (scrollPositions.current.get(key!) ?? 0) * element.clientHeight;
   }, [key, element]);
}
