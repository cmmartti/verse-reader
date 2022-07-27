export type DialogElementAttributes = {
    open?: string | null;
};

export default class DialogElement extends HTMLElement {
    static TOGGLE_EVENT = "super-dialog-toggle";

    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "-1");

        // if (!this.hasAttribute("aria-modal")) this.setAttribute("aria-modal", "true");
        // else this.setAttribute("aria-modal", "false");
        if (!this.open) this.setAttribute("aria-hidden", "true");

        document.addEventListener("keydown", this.#documentKeydown);
        document.body.addEventListener("focus", this.#maintainFocus, true);
    }

    disconectedCallback() {
        document.removeEventListener("keydown", this.#documentKeydown);
        document.body.removeEventListener("focus", this.#maintainFocus, true);
    }

    #previouslyFocused: HTMLElement | null = null;

    static observedAttributes = ["open"];
    attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ) {
        if (name === "open") {
            if (newValue !== null) {
                // Block duplicate calls to prevent polluting #previouslyFocused
                // with the wrong element
                if (newValue === oldValue) return;

                this.removeAttribute("aria-hidden");

                // Keep a reference to the current focused element to restore later
                this.#previouslyFocused = document.activeElement as HTMLElement;

                // Focus the dialog, or the first autofocus element (if one exists),
                // on the next tick (to prevent keyup events, etc. from stealing focus)
                setTimeout(() => {
                    let autofocus = this.querySelector(
                        "[autofocus]"
                    ) as HTMLElement | null;
                    if (autofocus && autofocus.focus) autofocus.focus();
                    else this.focus();
                }, 0);
            } else {
                this.setAttribute("aria-hidden", "true");

                // If there was a focused element before the dialog was opened,
                // restore the focus back to it (if it has a focus method)
                if (this.#previouslyFocused && this.#previouslyFocused.focus)
                    this.#previouslyFocused.focus();
                else document.body.focus();
            }
        }
    }

    get open() {
        return this.hasAttribute("open");
    }
    set open(open: boolean) {
        if (open) this.setAttribute("open", "");
        else this.removeAttribute("open");
    }

    /**
     * Imperatively toggle the dialog open/closed. Will also dispatch a TOGGLE_EVENT.
     * (Manually opening or closing the dialog by setting the `open` property will
     * not dispatch events.)
     * @param open Whether the dialog should open or close
     */
    toggle(open: boolean) {
        this.open = open;
        this.#dispatchEvent();
    }

    #dispatchEvent(sourceEvent?: Event) {
        this.dispatchEvent(
            new CustomEvent(DialogElement.TOGGLE_EVENT, {
                bubbles: true,
                cancelable: false,
                detail: sourceEvent,
            })
        );
    }

    /**
     * Keydown event handler for the document:
     *
     * Listen for Escape to hide the dialog, and Tab to trap focus within the dialog.
     */
    #documentKeydown = (event: Event) => {
        if (!this.open) return;
        if (
            this.getAttribute("aria-modal") !== "true" &&
            !this.contains(document.activeElement)
        )
            return;

        let key = (event as KeyboardEvent).key;

        // Hide the dialog when Escape is pressed, unless this is an alertdialog
        if (key === "Escape" && this.getAttribute("role") !== "alertdialog") {
            event.preventDefault();
            this.open = false;
            this.#dispatchEvent(event);
        }

        // When Tab is used to move focus, make sure the focus never leaves the dialog
        else if (key === "Tab") {
            trapTabKey(this, event);
        }
    };

    /**
     * Focus event handler for the body:
     *
     * If the focus leaves an open, modal dialog for whatever reason, force it back.
     */
    #maintainFocus = (event: Event) => {
        if (this.open) {
            let target = event.target as HTMLElement | null;
            if (target && !target.closest('[role="dialog"]')) {
                if (this.getAttribute("aria-modal") === "true") this.focus();
            }
        }
    };
}

/**
 * Trap the focus inside the given element.
 */
function trapTabKey(node: Element, event: Event) {
    let focusableChildren = getFocusableChildren(node);

    let focusedItemIndex = document.activeElement
        ? focusableChildren.indexOf(document.activeElement as HTMLElement)
        : -1;

    // If the Shift key is being pressed (moving backwards) and the currently
    // focused item is the first one, move the focus to the last focusable item.
    if ((event as KeyboardEvent).shiftKey && focusedItemIndex === 0) {
        focusableChildren[focusableChildren.length - 1]?.focus();
        event.preventDefault();
    }

    // If the Shift key is not being pressed (moving forwards) and the currently
    // focused item is the last one, move the focus to the first focusable item.
    else if (
        !(event as KeyboardEvent).shiftKey &&
        focusedItemIndex === focusableChildren.length - 1
    ) {
        focusableChildren[0]?.focus();
        event.preventDefault();
    }
}

const focusableSelectors = [
    'a[href]:not([tabindex^="-"])',
    'area[href]:not([tabindex^="-"])',
    'input:not([type="hidden"]):not([type="radio"]):not([disabled]):not([tabindex^="-"])',
    'input[type="radio"]:not([disabled]):not([tabindex^="-"])',
    'select:not([disabled]):not([tabindex^="-"])',
    'textarea:not([disabled]):not([tabindex^="-"])',
    'button:not([disabled]):not([tabindex^="-"])',
    'iframe:not([tabindex^="-"])',
    'audio[controls]:not([tabindex^="-"])',
    'video[controls]:not([tabindex^="-"])',
    '[contenteditable]:not([tabindex^="-"])',
    '[tabindex]:not([tabindex^="-"])',
];

function getFocusableChildren(node: Element) {
    return [...node.querySelectorAll(focusableSelectors.join(","))]
        .map(child => child as HTMLElement)
        .filter(
            child =>
                child.offsetWidth > 0 ||
                child.offsetHeight > 0 ||
                child.getClientRects().length > 0
        ) as HTMLElement[];
}
