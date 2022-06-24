import MenuElement from "./MenuElement";

export type MenuButtonElementAttributes = {
    for?: string | null;
};

export default class MenuButtonElement extends HTMLElement {
    connectedCallback() {
        if (!this.hasAttribute("role")) this.setAttribute("role", "button");
        if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");

        document.addEventListener(MenuElement.TOGGLE_EVENT, this.#onToggle);
        this.addEventListener("mousedown", this.#onMousedown);
        this.addEventListener("mouseup", this.#onMouseup);
        this.addEventListener("keyup", this.#onKeyup);
        document.addEventListener("mousedown", this.#documentMousedown);
    }

    disconnectedCallback() {
        document.removeEventListener(MenuElement.TOGGLE_EVENT, this.#onToggle);
        this.removeEventListener("mousedown", this.#onMousedown);
        this.removeEventListener("mouseup", this.#onMouseup);
        this.removeEventListener("keyup", this.#onKeyup);
        document.removeEventListener("mousedown", this.#documentMousedown);
    }

    get for() {
        return this.getAttribute("for") || "";
    }

    set for(value: string) {
        this.setAttribute("for", value);
    }

    get #menu() {
        let htmlFor = this.getAttribute("for");
        if (htmlFor) {
            let element = document.getElementById(htmlFor);
            if (element instanceof MenuElement) return element;
        }
        return null;
    }

    #onToggle = (event: Event) => {
        let target = event.target;
        let menu = this.#menu;
        if (target && target === menu) {
            // The menu was just opened
            if (menu.open) {
                this.setAttribute("aria-expanded", "true");
            }

            // The menu was just closed
            else {
                this.removeAttribute("aria-expanded");

                // The menu button always receives the focus first when the menu
                // is closed. This keeps the menu out of the tab order and makes
                // it behave like a child of the menu button, even if the DOM elements
                // are not adjacent.
                this.focus();
            }
        }
    };

    /**
     * Show the menu on mouse down. This allows for clicking down on the menu
     * button and releasing over the desired menuitem as with classic desktop menus.
     */
    #onMousedown = (event: Event) => {
        let menu = this.#menu;
        if (menu && !menu.open) {
            event.preventDefault(); // allow the menu to take the focus
            menu.toggle(true);

            // Prevent the mouseup event from closing the menu again
            this.#preventMouseupEvent = true;
        }
    };

    #preventMouseupEvent = false;

    /**
     * Hide the menu on mouse up.
     */
    #onMouseup = (event: Event) => {
        if (this.#preventMouseupEvent) event.preventDefault();
        else this.#menu?.toggle(false);
        this.#preventMouseupEvent = false; // reset to false each time
    };

    /**
     * Show the menu on ArrowDown/Enter/Space keyup, focusing the first menuitem.
     */
    #onKeyup = (event: Event) => {
        let menu = this.#menu;
        if (!menu) return;

        switch ((event as KeyboardEvent).key) {
            case "ArrowDown":
            case "Enter":
            case " ":
                if (menu && !menu.open) {
                    // event.preventDefault();
                    menu.toggle(true);
                    menu.focusMenuItem(0);
                }
                break;
        }
    };

    /**
     * Close the menu if the mouse was pressed down outside of the menu or menu button.
     */
    #documentMousedown = (event: Event) => {
        let menu = this.#menu;
        if (!menu || !menu.open) return;

        let target = event.target as Element | null;
        if (!this.contains(target) && !menu.contains(target)) {
            menu.toggle(false);
            this.focus();
        }
    };
}
