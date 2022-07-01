export type MenuElementAttributes = {
    open?: string | null;
};

const SYNTHETIC_CLICK = 1827589;

export default class MenuElement extends HTMLElement {
    static TOGGLE_EVENT = "super-menu-toggle";

    connectedCallback() {
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "-1");
        if (!this.hasAttribute("role")) this.setAttribute("role", "menu");

        if (!this.open) this.setAttribute("aria-hidden", "true");
        else this.removeAttribute("aria-hidden");

        this.addEventListener("mousemove", this.#menuMousemove);
        this.addEventListener("mouseleave", this.#menuMouseleave);
        document.body.addEventListener("focus", this.#bodyFocus, true);

        this.addEventListener("keydown", this.#menuKeydown);
        document.addEventListener("keyup", this.#documentKeyup, true);

        // Menuitems should activate on mouseup, not click. But menuitems only have
        // click handlers, not mouseup handlers. Therefore, simulate a click on
        // the target menuitem upon mouseup to activate the click handler.
        this.addEventListener("mouseup", this.#menuMouseup);

        // Add the event listener to the capture phase instead of the bubbling phase.
        // This is so we can prevent click events from ever reaching the target.
        this.addEventListener("click", this.#menuClick, true);
    }

    disconnectedCallback() {
        this.removeEventListener("mousemove", this.#menuMousemove);
        this.removeEventListener("mouseleave", this.#menuMouseleave);
        document.body.removeEventListener("focus", this.#bodyFocus, true);

        this.removeEventListener("keydown", this.#menuKeydown);
        document.removeEventListener("keyup", this.#documentKeyup, true);
        this.removeEventListener("mouseup", this.#menuMouseup);
        this.removeEventListener("click", this.#menuClick, true); // capture
    }

    static observedAttributes = ["open"];
    attributeChangedCallback(
        name: string,
        _oldValue: string | null,
        newValue: string | null
    ) {
        if (name === "open") {
            // Menu was opened
            if (newValue !== null) {
                // Remove child menuitems from the tab order. Do it every time
                // the menu is opened instead of in connectedCallback to catch
                // newly-created menuitems
                this.#menuitems.forEach(menuitem =>
                    menuitem.setAttribute("tabindex", "-1")
                );

                this.removeAttribute("aria-hidden");
                this.focus();
            }

            // Menu was closed
            else this.setAttribute("aria-hidden", "true");
        }
    }

    get #menuitems() {
        return [...this.querySelectorAll('[role^="menuitem"]')] as HTMLElement[];
    }

    /**
     * Focus the menuitem at `index`. A negative `index` counts backwards.
     *  - 0 is the first menuitem
     *  - -1 is the last menuitem
     */
    focusMenuItem(index: number) {
        let menuitems = this.#menuitems;
        if (index < 0) {
            index = menuitems.length + index;
        }
        index = Math.min(index, menuitems.length - 1);
        menuitems[index]?.focus();
    }

    get open() {
        return this.hasAttribute("open");
    }

    set open(open: boolean) {
        if (open) this.setAttribute("open", "");
        else this.removeAttribute("open");
    }

    /**
     * Imperatively toggle the menu open/closed. Will also dispatch a TOGGLE_EVENT.
     * (Manually opening or closing the menu by setting the `open` property will
     * not dispatch events.)
     * @param open Whether the menu should open or close
     */
    toggle(open: boolean) {
        this.open = open;
        this.#dispatchEvent();
    }

    #dispatchEvent(sourceEvent?: Event) {
        this.dispatchEvent(
            new CustomEvent(MenuElement.TOGGLE_EVENT, {
                bubbles: true,
                cancelable: false,
                detail: sourceEvent,
            })
        );
    }

    /**
     * Dispatch a synthetic click event to the target `menuitem`.
     * @param menuitem The menuitem element to target
     * @param event The source event. Will be merged with the dispatched click event
     */
    #clickMenuItem(menuitem: Element, event: Event) {
        if (
            menuitem.hasAttribute("disabled") ||
            menuitem.getAttribute("aria-disabled") === "true"
        ) {
            return;
        }

        // Assign a specific value to the `detail` property that we can identify later.
        let clickEvent = new MouseEvent("click", {
            // ...event,
            button: 0,
            bubbles: true,
            detail: SYNTHETIC_CLICK,
        });

        // Dispatch this new click event to the target menuitem
        menuitem.dispatchEvent(clickEvent);

        // Close the menu
        this.open = false;
        this.#dispatchEvent(event);
    }

    /**
     * Mouseup event handler for the menu:
     *
     * Trigger a click on the menuitem under the mouse.
     */
    #menuMouseup = (event: MouseEvent) => {
        if (!this.open) return;

        let menuitem = (event.target as Element | null)?.closest('[role^="menuitem"]');

        // Primary mouse button only (left-click)
        if (menuitem && event.button === 0) {
            event.preventDefault();
            this.#clickMenuItem(menuitem, event);
        }
    };

    /**
     * Click event handler for the menu:
     *
     * Block all click events on menuitems except those dispatched by the clickMenuItem
     * function (identified by a specific value set on the `detail` property).
     */
    #menuClick = (event: MouseEvent) => {
        if (event.detail !== SYNTHETIC_CLICK) {
            event.stopPropagation();
            event.preventDefault();
        }
    };

    /**
     * Mousemove event handler for the menu:
     *
     * Focus the menuitem under the mouse, or focus the menu itself if the mouse
     * is not over a menuitem.
     */
    #menuMousemove = (event: Event) => {
        if (!this.open) return;

        let target = event.target as Element | null;
        let menuitem = target?.closest('[role^="menuitem"]') as HTMLElement | null;
        if (menuitem && menuitem.focus) {
            menuitem.focus();
        } else this.focus();
    };

    /**
     * Mouseleave event handler for the menu:
     *
     * Focus the menu element when the focus leaves the menu (defocusing any menuitems).
     */
    #menuMouseleave = () => {
        if (this.open) this.focus();
    };

    /**
     * Focus event handler for the body:
     *
     * If the focus leaves the open dialog for whatever reason, close the menu
     */
    #bodyFocus = (event: Event) => {
        if (this.open) {
            let target = event.target as HTMLElement | null;
            if (target && !this.contains(target)) {
                // this.open = false;
                // this.#dispatchEvent(event);
            }
        }
    };

    /**
     * Prevent events that occur on keydown from also triggering keyup listeners.
     * Specifically, menu items are activated on keydown (triggering a menu close and
     * focusing the menu-button), but menu buttons are triggered on keyup.
     */
    #preventKeyupEvent = false;

    /**
     * Keydown event handler for the menu:
     *  - Escape/Tab hides the menu
     *  - ArrowUp/ArrowDown/Home/End moves focus between menuitems
     *  - Enter triggers a click on the focused menuitem
     *  - Keys matching a menuitem's `accesskey` attribute will also trigger that menuitem
     */
    #menuKeydown = (event: KeyboardEvent) => {
        if (!this.open) return;

        let target = event.target as HTMLElement | null;

        let items = this.#menuitems;
        let currentIndex = items.findIndex(
            menuitem => menuitem === target?.closest('[role^="menuitem"]')
        );

        switch (event.key) {
            case "Escape":
                event.preventDefault();
                event.stopPropagation();
                this.open = false;
                this.#dispatchEvent(event);
                break;

            case "Tab":
                // Do not call event.preventDefault for the Tab key, but allow the
                // browser to move the focus to the next tabindex as usual.
                this.open = false;
                this.#dispatchEvent(event);
                break;

            case "Enter": {
                event.preventDefault();
                let menuitem = target?.closest('[role^="menuitem"]');
                if (menuitem) {
                    this.#preventKeyupEvent = true;
                    this.#clickMenuItem(menuitem, event);
                }
                break;
            }

            case "ArrowDown":
                event.preventDefault();
                items[(currentIndex + 1) % items.length]?.focus();
                break;
            case "ArrowUp":
                event.preventDefault();
                if (currentIndex === -1) items[items.length - 1]?.focus();
                else {
                    items[(currentIndex - 1 + items.length) % items.length]?.focus();
                }
                break;
            case "Home":
                event.preventDefault();
                items[0]?.focus();
                break;
            case "End":
                event.preventDefault();
                items[items.length - 1]?.focus();
                break;

            default: {
                // Click the first menuitem that has this key as an accesskey.
                let menuitem = this.querySelector(
                    `[role^="menuitem"][accesskey="${event.key}"]`
                );
                if (menuitem) {
                    event.preventDefault();
                    this.#clickMenuItem(menuitem, event);
                }
            }
        }
    };

    #documentKeyup = (event: KeyboardEvent) => {
        if (this.#preventKeyupEvent) {
            event.preventDefault();
            event.stopPropagation();
        }
        this.#preventKeyupEvent = false; // reset to false each time
    };
}
