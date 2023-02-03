import React from "react";

const TOUCH_END_DELAY = 300;
const DOUBLE_TAP_DELAY = 300;

export function useTapActions<E extends HTMLElement>(
   elementRef: React.MutableRefObject<E>,
   {
      right,
      left,
      middle,
   }: {
      right?: () => void;
      left?: () => void;
      middle?: () => void;
   }
) {
   React.useEffect(() => {
      let page = elementRef.current;

      let touchStart: Touch | undefined;
      let releaseTimeout: NodeJS.Timeout | null = null;
      let doubleTapTimeout: NodeJS.Timeout | null = null;

      function touchStartHandler(event: TouchEvent) {
         if (event.target instanceof HTMLElement && event.target.tabIndex >= 0) {
            return;
         }

         if (event.touches.length === 1) {
            touchStart = event.touches[0]!;
            releaseTimeout = setTimeout(() => (releaseTimeout = null), TOUCH_END_DELAY);
            page.addEventListener("touchend", touchEndHandler);
         }
      }

      function touchEndHandler(event: TouchEvent) {
         if (event.changedTouches.length === 1) {
            let touchEnd = event.changedTouches[0];

            // Check for abort conditions
            if (
               !touchEnd ||
               !touchStart ||
               //↓ Touch target is an anchor
               (touchEnd.target instanceof Element && touchEnd.target.tagName === "A") ||
               //↓ Touch location has moved
               Math.abs(touchStart.clientX - touchEnd.clientX) >= 3 ||
               Math.abs(touchStart.clientY - touchEnd.clientY) >= 3 ||
               //↓ Touch end was not within TOUCH_END_DELAY of touch start.
               //  This is to not block long presses (native text selection).
               !releaseTimeout ||
               //↓ Text is currently selected. Abort to allow for dismissal of selected
               //  text by tapping anywhere without unintentionally triggering an action.
               document.getSelection()?.toString()
            ) {
               return;
            }

            let pageRect = page.getBoundingClientRect();
            let ratio = (touchStart.clientX - pageRect.left) / pageRect.width;

            // Left side
            if (ratio <= 0.25) {
               event.preventDefault();
               left?.();
            }

            // Right side
            else if (ratio >= 0.75) {
               event.preventDefault();
               right?.();
            }

            // Middle
            else {
               // middle?.();
               // event.preventDefault();
               if (doubleTapTimeout) {
                  middle?.();
                  event.preventDefault();
               } else {
                  doubleTapTimeout = setTimeout(
                     () => (doubleTapTimeout = null),
                     DOUBLE_TAP_DELAY
                  );
               }
            }

            page.removeEventListener("touchend", touchEndHandler);
         }
      }

      page.addEventListener("touchstart", touchStartHandler);
      return () => {
         page.removeEventListener("touchstart", touchStartHandler);
         page.removeEventListener("touchend", touchEndHandler);
      };
   }, [right, left, middle, elementRef]);
}
