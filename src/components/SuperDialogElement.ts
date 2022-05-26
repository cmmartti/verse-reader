export type ADialogElementAttributes = {
    open?: string | null;
};

export class SuperDialogElement extends HTMLElement {
    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "dialog");
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "-1");
        if (!this.hasAttribute("aria-modal")) this.setAttribute("aria-modal", "true");

        if (!this.open) this.setAttribute("aria-hidden", "true");

        document.addEventListener("click", this.#documentClick);
        document.addEventListener("keydown", this.#documentKeydown);
        document.addEventListener("mousedown", this.#documentMousedown);
        document.body.addEventListener("focus", this.#maintainFocus, true);
    }

    disconectedCallback() {
        document.removeEventListener("click", this.#documentClick);
        document.removeEventListener("keydown", this.#documentKeydown);
        document.removeEventListener("mousedown", this.#documentMousedown);
        document.body.removeEventListener("focus", this.#maintainFocus, true);
    }

    static observedAttributes = ["open"];

    #previouslyFocused: HTMLElement | null = null;

    attributeChangedCallback(
        name: string,
        oldValue: string | null,
        newValue: string | null
    ) {
        if (name === "open") {
            if (newValue !== null && newValue !== oldValue) {
                // Block duplicate calls to prevent polluting #previouslyFocused
                // with the wrong element
                if (newValue === oldValue) return;

                this.removeAttribute("aria-hidden");

                // Keep a reference to the current focused element so we can restore it later
                this.#previouslyFocused = document.activeElement as HTMLElement;

                // Focus the dialog, or the first autofocus element (if one exists)
                let autofocus = this.querySelector("[autofocus]") as HTMLElement;
                if (autofocus && autofocus.focus) autofocus.focus();
                else this.focus();
            } else {
                this.setAttribute("aria-hidden", "true");

                // If there was a focused element before the dialog was opened,
                // restore the focus back to it (if it has a focus method)
                if (this.#previouslyFocused && this.#previouslyFocused.focus) {
                    this.#previouslyFocused.focus();
                } else {
                    document.body.focus();
                }
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
     * Keydown event handler for the document:
     *
     * Listen for Escape to hide the dialog, and Tab to trap focus within the dialog.
     */
    #documentKeydown = (event: Event) => {
        if (!this.open) return;

        let key = (event as KeyboardEvent).key;

        // Hide the dialog when Escape is pressed, unless this is an alertdialog
        if (key === "Escape" && this.getAttribute("role") !== "alertdialog") {
            event.preventDefault();
            this.open = false;
            this.dispatchEvent(new CustomEvent("toggle", { detail: event }));
        }

        // When Tab is used to move focus, make sure the focus never leaves the dialog
        else if (key === "Tab") {
            trapTabKey(this, event);
        }
    };

    /**
     * Click event handler for the document:
     *
     * Listen for click events on open/close/toggle buttons.
     * (Event delegation allows such buttons to be created at any time).
     */
    #documentClick = (event: Event) => {
        if (event.target === null) return;
        let target = event.target as HTMLElement;

        // Is the target a "close" button?
        if (this.open) {
            if (
                this.contains(target.closest("[data-super-dialog-close]")) ||
                (this.id && target.closest(`[data-super-dialog-close="${this.id}"]`)) ||
                (this.id && target.closest(`[data-super-dialog-toggle="${this.id}"]`))
            ) {
                this.open = false;
                this.dispatchEvent(new CustomEvent("toggle", { detail: event }));
            }
        }

        // Is the target an "open" button?
        else if (!this.open) {
            if (
                (this.id && target.closest(`[data-super-dialog-open="${this.id}"]`)) ||
                (this.id && target.closest(`[data-super-dialog-toggle="${this.id}"]`))
            ) {
                this.open = true;
                this.dispatchEvent(new CustomEvent("toggle", { detail: event }));
            }
        }
    };

    /**
     * Mousedown event handler for the document:
     *
     * Hide the dialog if a mousedown occurs outside the dialog (see exceptions
     * in the source code).
     */
    #documentMousedown = (event: Event) => {
        if (!this.open) return;

        let target = event.target as Element;
        if (
            this.getAttribute("role") !== "alertdialog" &&
            !target.closest(`[data-super-dialog-toggle="${this.id}"]`) &&
            !target.closest(`[data-super-dialog-hide="${this.id}"]`) &&
            !this.contains(target)
        ) {
            this.open = false;
            this.dispatchEvent(new CustomEvent("toggle", { detail: event }));
        }
    };

    /**
     * Focus event handler for the body:
     *
     * If the focus leaves the open dialog for whatever reason, force it back.
     */
    #maintainFocus = (event: Event) => {
        if (this.open) {
            let target = event.target as HTMLElement | null;
            if (target && !target.closest('[aria-modal="true"]')) {
                this.focus();
            }
        }
    };
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

/**
 * Trap the focus inside the given element.
 */
function trapTabKey(node: Element, event: Event) {
    let focusableChildren = [...node.querySelectorAll(focusableSelectors.join(","))]
        .map(child => child as HTMLElement)
        .filter(
            child =>
                child.offsetWidth > 0 ||
                child.offsetHeight > 0 ||
                child.getClientRects().length > 0
        ) as HTMLElement[];

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

customElements.define("super-dialog", SuperDialogElement);
