export type Listener = (menuElement: Element, event?: Event) => void;

const SYNTHETIC_CLICK = 1827589;

export default class A11yMenu {
    private shown: boolean = false;
    private listeners: Record<string, Listener[]> = {};
    private menuitems: HTMLElement[] = [];

    constructor(
        private menuElement: HTMLElement,
        private buttonElement: HTMLButtonElement
    ) {
        if (!menuElement) {
            console.error("[A11y-Menu] No menu element");
            return;
        }
        if (!buttonElement) {
            console.error("[A11y-Menu] No menu button element");
            return;
        }

        this.documentMousedown = this.documentMousedown.bind(this);
        this.documentKeydown = this.documentKeydown.bind(this);

        this.buttonMouseup = this.buttonMouseup.bind(this);
        this.buttonMousedown = this.buttonMousedown.bind(this);
        this.buttonKeyup = this.buttonKeyup.bind(this);

        this.menuKeydown = this.menuKeydown.bind(this);
        this.menuMouseup = this.menuMouseup.bind(this);
        this.menuMousemove = this.menuMousemove.bind(this);
        this.menuMouseleave = this.menuMouseleave.bind(this);
        this.menuClick = this.menuClick.bind(this);

        this.create();
    }

    /** Set up everything necessary for the menu to be functional */
    create() {
        if (!this.menuElement.getAttribute("aria-hidden")) {
            console.error(
                '[A11y-Menu] Menus should have an initial `aria-hidden="true"` attribute to avoid flashing an open menu on page load.'
            );
        }

        this.menuElement.setAttribute("aria-hidden", "true");
        this.menuElement.setAttribute("tabindex", "-1");

        this.buttonElement.addEventListener("mousedown", this.buttonMousedown);
        this.buttonElement.addEventListener("mouseup", this.buttonMouseup);
        this.buttonElement.addEventListener("keyup", this.buttonKeyup);

        this.fire("create");
    }

    /** Hide the menu if the mouse was pressed down outside of the menu or menu button. */
    private documentMousedown(event: Event) {
        let target = event.target as Element | null;
        if (!this.buttonElement.contains(target) && !this.menuElement.contains(target)) {
            this.hide();
        }
    }

    /** Hide the menu when Escape or Tab is pressed. */
    private documentKeydown(event: KeyboardEvent) {
        switch (event.key) {
            case "Escape":
                event.preventDefault();
                this.hide();
                break;
            case "Tab":
                // Hide the menu and return the focus to the menu button.
                this.hide();
                // Do not call event.preventDefault: instead, allow the
                // browser to move the focus to the next tabindex as usual.
                break;
        }
    }

    /**
     * Show the menu on mouse down. This allows for clicking down on the menu
     * button and releasing over the desired menuitem.
     */
    private buttonMousedown(event: Event) {
        if (!this.shown) {
            event.preventDefault();
            this.show(event);
            this.preventMouseupEvent = true;
        }
    }

    /** Prevent events that occur on mousedown from also triggering mouseup listeners. */
    private preventMouseupEvent = false;

    /** Hide the menu on mouse up. */
    private buttonMouseup(event: Event) {
        if (this.preventMouseupEvent) event.preventDefault();
        else this.toggle(event);
        this.preventMouseupEvent = false;
    }

    /** Prevent events that occur on keydown from also triggering keyup listeners. */
    private preventKeyupEvent = false;

    /** Show the menu on ArrowDown/Enter/Space, focusing the first menuitem. */
    private buttonKeyup(event: Event) {
        switch ((event as KeyboardEvent).key) {
            case "ArrowDown":
            case "Enter":
            case " ":
                if (this.preventKeyupEvent) event.preventDefault();
                else if (!this.shown) {
                    (event.target as HTMLElement | null)?.focus();
                    this.show(event, 0);
                    event.preventDefault();
                }
                this.preventKeyupEvent = false;
                break;
        }
    }

    /** Trigger a click on the menuitem under the mouse on mouseup. */
    private menuMouseup(event: MouseEvent) {
        let menuitem = (event.target as Element | null)?.closest('[role^="menuitem"]');

        // Primary mouse button only (left-click)
        if (menuitem && event.button === 0) {
            this.clickMenuItem(menuitem, event);
        }
    }

    /**
     * Block all click events on menuitems except those dispatched by the clickMenuItem
     * function (identified by a specific value set on the `detail` property).
     */
    private menuClick(event: MouseEvent) {
        if (event.detail !== SYNTHETIC_CLICK) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    /**
     * Focus the menuitem under the mouse, or focus the menu itself if the mouse
     * is not over a menuitem.
     */
    private menuMousemove(event: Event) {
        let target = event.target as Element | null;
        let menuitem = target?.closest('[role^="menuitem"]') as HTMLElement | null;
        if (menuitem && menuitem.focus) {
            menuitem.focus();
        } else {
            this.menuElement.focus();
        }
    }

    /**
     * Focus the menu element when the focus leaves the menu (defocusing any menuitems).
     */
    private menuMouseleave() {
        this.menuElement.focus();
    }

    /**
     * Move focus between menuitems with ArrowUp/ArrowDown and home/end, and
     * trigger a click on a menuitem on Enter. Also trigger menuitems with an
     * accesskey attribute matching the key pressed.
     */
    private menuKeydown(event: KeyboardEvent) {
        let target = event.target as HTMLElement | null;

        let items = this.menuitems;
        let currentIndex = items.findIndex(
            menuitem => menuitem === target?.closest('[role^="menuitem"]')
        );

        switch (event.key) {
            case "Enter": {
                let menuitem = target?.closest('[role^="menuitem"]');
                if (menuitem) {
                    event.preventDefault();
                    this.clickMenuItem(menuitem, event);
                    this.preventKeyupEvent = true;
                }
                break;
            }
            case "ArrowDown":
                event.preventDefault();
                items[(currentIndex + 1) % items.length].focus();
                break;
            case "ArrowUp":
                event.preventDefault();
                if (currentIndex === -1) items[items.length - 1].focus();
                else {
                    items[(currentIndex - 1 + items.length) % items.length].focus();
                }
                break;
            case "Home":
                event.preventDefault();
                items[0].focus();
                break;
            case "End":
                event.preventDefault();
                items[items.length - 1].focus();
                break;
            default: {
                // Click the first menuitem that has this key as an accesskey.
                let menuitem = this.menuElement.querySelector(
                    `[role^="menuitem"][accesskey="${event.key}"]`
                );
                if (menuitem) this.clickMenuItem(menuitem, event);
            }
        }
    }

    /**
     * Dispatch a synthetic click event to the target `menuitem`.
     * @param menuitem The menuitem element to target
     * @param event The source event. Will be merged with the dispatched click event
     */
    private clickMenuItem(menuitem: Element, event: Event) {
        if (
            menuitem.getAttribute("disabled") ||
            menuitem.getAttribute("aria-disabled")
        ) {
            return;
        }

        // Assign a specific value to the `detail` property that we can identify later.
        let clickEvent = new MouseEvent("click", {
            ...event,
            button: 0,
            bubbles: true,
            detail: SYNTHETIC_CLICK,
        });

        // Dispatch this new click event to the target menuitem
        menuitem.dispatchEvent(clickEvent);

        this.hide();
    }

    /** Show or hide the menu. */
    toggle(event?: Event) {
        if (this.shown) this.hide(event);
        else this.show(event);
    }

    /**
     * Show the menu and set the focus to the menu or a menuitem.
     * @param event The source event
     * @param initialFocus Which menuitem should receive the focus, if any. 0-based index.
     */
    show(event?: Event, initialFocus?: number) {
        if (this.shown) return;

        this.menuitems = [
            ...this.menuElement.querySelectorAll('[role^="menuitem"]'),
        ] as HTMLElement[];

        this.menuitems.forEach(menuitem => menuitem.setAttribute("tabindex", "-1"));

        this.shown = true;
        this.menuElement.removeAttribute("aria-hidden");

        // Menuitems should activate on mouseup, not click. But menuitems only have
        // click handlers, not mouseup handlers. Therefore, simulate a click on
        // the target menuitem upon mouseup to activate the click handler.
        this.menuElement.addEventListener("mouseup", this.menuMouseup);

        // Add the event listener to the capture phase instead of the bubbling phase.
        // This is so we can prevent click events from ever reaching the target.
        this.menuElement.addEventListener("click", this.menuClick, true);

        this.menuElement.addEventListener("mousemove", this.menuMousemove);
        this.menuElement.addEventListener("mouseleave", this.menuMouseleave);
        this.menuElement.addEventListener("keydown", this.menuKeydown);

        document.addEventListener("mousedown", this.documentMousedown);
        document.addEventListener("keydown", this.documentKeydown);

        this.buttonElement.setAttribute("aria-expanded", "true");

        if (initialFocus !== undefined && this.menuitems[initialFocus]) {
            this.menuitems[initialFocus].focus();
        } else this.menuElement.focus();

        this.fire("show", event);
    }

    /**
     * Hide the menu and return focus to the menu button.
     */
    hide(event?: Event) {
        if (!this.shown) return;

        this.shown = false;
        this.menuElement.setAttribute("aria-hidden", "true");

        this.buttonElement.removeAttribute("aria-expanded");
        this.buttonElement.focus();

        this.menuElement.removeEventListener("mousemove", this.menuMousemove);
        this.menuElement.removeEventListener("mouseleave", this.menuMouseleave);
        this.menuElement.removeEventListener("keydown", this.menuKeydown);

        // Let these events finish firing before removing the listeners
        setTimeout(() => {
            this.menuElement.removeEventListener("click", this.menuClick, true);
            this.menuElement.removeEventListener("mouseup", this.menuMouseup);
        }, 0);

        document.removeEventListener("keydown", this.documentKeydown);
        document.removeEventListener("mousedown", this.documentMousedown);

        this.menuitems = [];

        this.fire("hide", event);
    }

    /**
     * Destroy the current instance (after hiding the menu)
     * and remove all associated listeners from menu buttons
     */
    destroy() {
        // Hide the menu to avoid destroying an open instance
        this.hide();

        this.buttonElement.removeEventListener("mousedown", this.buttonMousedown);
        this.buttonElement.removeEventListener("mouseup", this.buttonMouseup);
        this.buttonElement.removeEventListener("keyup", this.buttonKeyup);

        this.fire("destroy");
    }

    /**
     * Iterate over all registered handlers for given type and call them all with
     * the menu element as first argument, event as second argument (if any). Also
     * dispatch a custom event on the DOM element itself to make it possible to
     * react to the lifecycle of auto-instantiated tablists.
     */
    private fire(type: "create" | "destroy" | "hide" | "show", event?: Event) {
        var listeners = this.listeners[type] || [];

        var domEvent = new CustomEvent(type, { detail: event });
        this.menuElement.dispatchEvent(domEvent);

        for (let listener of listeners) {
            listener(this.menuElement, event);
        }
    }
}
