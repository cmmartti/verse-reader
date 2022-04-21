import focusableSelectors from "focusable-selectors";

export type Listener = (menuElement: Element, event?: Event) => void;

/**
 * Forked from https://github.com/KittyGiraudel/a11y-dialog.
 * Add TypeScript and allow usage without an overlay.
 */
export default class A11yDialog {
    private dialog: Element;
    shown: boolean = false;
    private id: string;
    private previouslyFocused: HTMLElement | null;
    private listeners: Record<string, Listener[]> = {};
    private openers: Element[] = [];
    private closers: Element[] = [];

    constructor(dialog: Element) {
        // Prebind the functions that will be bound in addEventListener and
        // removeEventListener to avoid losing references
        this.show = this.show.bind(this);
        this.hide = this.hide.bind(this);
        this.maintainFocus = this.maintainFocus.bind(this);
        this.bindKeypress = this.bindKeypress.bind(this);

        this.dialog = dialog;
        this.id = this.dialog.getAttribute("data-a11y-dialog") || this.dialog.id;
        this.previouslyFocused = null;
        this.listeners = {};

        // Initialise everything needed for the dialog to work properly
        this.create();
    }

    /** Set up everything necessary for the dialog to be functioning */
    create() {
        this.dialog.setAttribute("aria-hidden", "true");
        this.dialog.setAttribute("aria-modal", "true");
        this.dialog.setAttribute("tabindex", "-1");

        if (!this.dialog.hasAttribute("role")) {
            this.dialog.setAttribute("role", "dialog");
        }

        // Keep a collection of dialog openers, each of which will be bound a click
        // event listener to open the dialog
        this.openers = $$('[data-a11y-dialog-show="' + this.id + '"]');
        this.openers.forEach(opener => opener.addEventListener("click", this.show));

        // Keep a collection of dialog closers, each of which will be bound a click
        // event listener to close the dialog
        this.closers = $$("[data-a11y-dialog-hide]", this.dialog).concat(
            $$('[data-a11y-dialog-hide="' + this.id + '"]')
        );
        this.closers.forEach(closer => closer.addEventListener("click", this.hide));

        // Execute all callbacks registered for the `create` event
        this.fire("create");

        return this;
    }

    /**
     * Show the dialog element, disable all the targets (siblings), trap the
     * current focus within it, listen for some specific key presses and fire all
     * registered callbacks for `show` event
     */
    show(event?: Event) {
        // If the dialog is already open, abort
        if (this.shown) return this;

        // Keep a reference to the currently focused element to be able to restore
        // it later
        this.previouslyFocused = document.activeElement as HTMLElement;
        this.dialog.removeAttribute("aria-hidden");
        this.shown = true;

        // Set the focus to the dialog element
        moveFocusToDialog(this.dialog);

        // Bind a focus event listener to the body element to make sure the focus
        // stays trapped inside the dialog while open, and start listening for some
        // specific key presses (TAB and ESC)
        document.body.addEventListener("focus", this.maintainFocus, true);
        document.addEventListener("keydown", this.bindKeypress);

        // Execute all callbacks registered for the `show` event
        this.fire("show", event);

        return this;
    }

    /**
     * Hide the dialog element, enable all the targets (siblings), restore the
     * focus to the previously active element, stop listening for some specific
     * key presses and fire all registered callbacks for `hide` event
     */
    hide(event?: Event) {
        // If the dialog is already closed, abort
        if (!this.shown) return this;

        this.shown = false;
        this.dialog.setAttribute("aria-hidden", "true");

        // If there was a focused element before the dialog was opened (and it has a
        // `focus` method), restore the focus back to it
        // See: https://github.com/KittyGiraudel/a11y-dialog/issues/108
        // if (this.previouslyFocused && this.previouslyFocused.focus) {
        //     this.previouslyFocused.focus();
        // }
        this.previouslyFocused?.focus?.();

        // Remove the focus event listener to the body element and stop listening
        // for specific key presses
        document.body.removeEventListener("focus", this.maintainFocus, true);
        document.removeEventListener("keydown", this.bindKeypress);

        // Execute all callbacks registered for the `hide` event
        this.fire("hide", event);

        return this;
    }

    /**
     * Destroy the current instance (after making sure the dialog has been hidden)
     * and remove all associated listeners from dialog openers and closers
     */
    destroy() {
        // Hide the dialog to avoid destroying an open instance
        this.hide();

        // Remove the click event listener from all dialog openers
        this.openers.forEach(opener => opener.removeEventListener("click", this.show));

        // Remove the click event listener from all dialog closers
        this.closers.forEach(closer => closer.removeEventListener("click", this.hide));

        // Execute all callbacks registered for the `destroy` event
        this.fire("destroy");

        // Keep an object of listener types mapped to callback functions
        this.listeners = {};

        return this;
    }

    /** Register a new callback for the given event type */
    on(type: string, handler: () => void) {
        if (typeof this.listeners[type] === "undefined") {
            this.listeners[type] = [];
        }

        this.listeners[type].push(handler);

        return this;
    }

    /** Unregister an existing callback for the given event type */
    off(type: string, handler: () => void) {
        let index = (this.listeners[type] || []).indexOf(handler);

        if (index > -1) {
            this.listeners[type].splice(index, 1);
        }

        return this;
    }

    /**
     * Iterate over all registered handlers for given type and call them all with
     * the dialog element as first argument, event as second argument (if any). Also
     * dispatch a custom event on the DOM element itself to make it possible to
     * react to the lifecycle of auto-instantiated dialogs.
     */
    private fire(type: string, event?: Event) {
        let listeners = this.listeners[type] || [];
        let domEvent = new CustomEvent(type, { detail: event });

        this.dialog.dispatchEvent(domEvent);
        listeners.forEach(listener => listener(this.dialog, event));
    }

    /**
     * Private event handler used when listening to some specific key presses
     * (namely ESCAPE and TAB)
     */
    private bindKeypress(event: Event) {
        // This is an escape hatch in case there are nested dialogs, so the keypresses
        // are only reacted to for the most recent one
        if (!this.dialog.contains(document.activeElement)) return;

        // If the dialog is shown and the ESCAPE key is being pressed, prevent any
        // further effects from the ESCAPE key and hide the dialog, unless its role
        // is 'alertdialog', which should be modal
        if (
            this.shown &&
            (event as KeyboardEvent).key === "Escape" &&
            this.dialog.getAttribute("role") !== "alertdialog"
        ) {
            event.preventDefault();
            this.hide(event);
        }

        // If the dialog is shown and the TAB key is being pressed, make sure the
        // focus stays trapped within the dialog element
        if (this.shown && (event as KeyboardEvent).key === "Tab") {
            trapTabKey(this.dialog, event);
        }
    }

    /**
     * Private event handler used when making sure the focus stays within the
     * currently open dialog
     */
    private maintainFocus(event: Event) {
        let target = event.target as HTMLElement | null;

        // If the dialog is shown and the focus is not within a dialog element (either
        // this one or another one in case of nested dialogs) or within an element
        // with the `data-a11y-dialog-focus-trap-ignore` attribute, move it back to
        // its first focusable child.
        // See: https://github.com/KittyGiraudel/a11y-dialog/issues/177
        if (
            this.shown &&
            target &&
            !target.closest('[aria-modal="true"]') &&
            !target.closest("[data-a11y-dialog-ignore-focus-trap]")
        ) {
            moveFocusToDialog(this.dialog);
        }
    }
}

/**
 * Query the DOM for nodes matching the given selector, scoped to context (or
 * the whole document)
 */
function $$(selector: string, context: Document | Element = document) {
    return [...(context || document).querySelectorAll(selector)] as HTMLElement[];
}

/**
 * Set the focus to the first element with `autofocus` with the element or the
 * element itself
 */
function moveFocusToDialog(node: Element) {
    let focused = node.querySelector("[autofocus]") || node;
    (focused as HTMLElement).focus();
}

/** Get the focusable children of the given element */
function getFocusableChildren(node: Element) {
    return $$(focusableSelectors.join(","), node).filter(
        child =>
            !!(child.offsetWidth || child.offsetHeight || child.getClientRects().length)
    );
}

/*** Trap the focus inside the given element */
function trapTabKey(node: Element, event: Event) {
    let focusableChildren = getFocusableChildren(node);
    let focusedItemIndex = document.activeElement
        ? focusableChildren.indexOf(document.activeElement as HTMLElement)
        : -1;

    // If the SHIFT key is being pressed while tabbing (moving backwards) and
    // the currently focused item is the first one, move the focus to the last
    // focusable item from the dialog element
    if ((event as KeyboardEvent).shiftKey && focusedItemIndex === 0) {
        focusableChildren[focusableChildren.length - 1].focus();
        event.preventDefault();
        // If the SHIFT key is not being pressed (moving forwards) and the currently
        // focused item is the last one, move the focus to the first focusable item
        // from the dialog element
    } else if (
        !(event as KeyboardEvent).shiftKey &&
        focusedItemIndex === focusableChildren.length - 1
    ) {
        focusableChildren[0].focus();
        event.preventDefault();
    }
}

function instantiateDialogs() {
    $$("[data-a11y-dialog]").forEach(function (node) {
        new A11yDialog(node);
    });
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", instantiateDialogs);
    } else {
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(instantiateDialogs);
        } else {
            window.setTimeout(instantiateDialogs, 16);
        }
    }
}
