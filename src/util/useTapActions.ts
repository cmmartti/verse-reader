import React from "react";

export function useTapActions<E extends HTMLElement>(
    ref: React.MutableRefObject<E>,
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
        let page = ref.current;

        let startTouch: Touch;
        let waitingForSecondTap = false;

        function touchStartHandler(event: TouchEvent) {
            if (event.touches.length === 1) {
                startTouch = event.touches[0]!;
                page.addEventListener("touchend", touchEndHandler);
            }
        }

        function touchEndHandler(event: TouchEvent) {
            if (event.changedTouches.length === 1) {
                let endTouch = event.changedTouches[0]!;

                if (
                    Math.abs(startTouch.clientX - endTouch.clientX) < 3 &&
                    Math.abs(startTouch.clientY - endTouch.clientY) < 3
                ) {
                    let ratio = startTouch.clientX / page.clientWidth;

                    // Left side
                    if (ratio <= 0.33) {
                        // event.preventDefault();
                        left?.();
                    }

                    // Right side
                    else if (ratio >= 0.66) {
                        // event.preventDefault();
                        right?.();
                    }

                    // Middle
                    else {
                        if (!waitingForSecondTap) {
                            waitingForSecondTap = true;
                            setTimeout(() => {
                                waitingForSecondTap = false;
                            }, 300);
                        } else {
                            middle?.();
                            event.preventDefault();
                        }
                    }

                    page.removeEventListener("touchend", touchEndHandler);
                }
            }
        }

        page.addEventListener("touchstart", touchStartHandler);
        return () => {
            page.removeEventListener("touchstart", touchStartHandler);
            page.removeEventListener("touchend", touchEndHandler);
        };
    }, [right, left, middle, ref]);
}
