import MenuElement from "./MenuElement";
import { createPopper, Placement } from "@popperjs/core";

export type Trigger = "click" | "mousedown";

export type MenuButtonElementAttributes = {
   open?: string | null;
   for?: string | null;
   trigger?: Trigger;
   placement?: Placement;
   "eat-dismiss-clicks"?: string | null;
};

const DEFAULT_TRIGGER: Trigger = "mousedown";

export default class MenuButtonElement extends HTMLElement {
   static TOGGLE_EVENT = "menu-button-toggle";

   connectedCallback() {
      if (!this.hasAttribute("role")) this.setAttribute("role", "button");
      if (!this.hasAttribute("tabindex")) this.setAttribute("tabindex", "0");

      this.addEventListener("mousedown", this.#onMousedown);
      this.addEventListener("click", this.#onClick);
      this.addEventListener("keydown", this.#onKeydown);

      document.addEventListener(MenuElement.SELECTION_EVENT, this.#onSelection);
      document.addEventListener("mousedown", this.#onDocumentMousedown);

      let menu = this.#getMenu();
      if (menu) {
         menu.addEventListener("keydown", this.#onMenuKeydown);
         if (!this.open) menu.hidden = true;
         menu.setAttribute("tabindex", "-1");
         this.#attachMenu(menu);
      }
   }

   disconnectedCallback() {
      this.removeEventListener("mousedown", this.#onMousedown);
      this.removeEventListener("click", this.#onClick);
      this.removeEventListener("keydown", this.#onKeydown);

      document.removeEventListener(MenuElement.SELECTION_EVENT, this.#onSelection);
      document.removeEventListener("mousedown", this.#onDocumentMousedown);

      let menu = this.#getMenu();
      if (menu) {
         menu.removeEventListener("keydown", this.#onMenuKeydown);
      }
   }

   static observedAttributes = ["placement", "open"];
   attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      newValue: string | null
   ) {
      let menu = this.#getMenu();
      if (!menu) return;

      switch (name) {
         case "placement":
            if (this.open) this.#attachMenu(menu);
            break;
         case "open":
            if (newValue !== null) {
               this.#attachMenu(menu);
               menu.hidden = false;
               menu.focus();
            } else {
               menu.hidden = true;
            }
            break;
      }
   }

   #attachMenu(menu: MenuElement) {
      createPopper(this, menu, {
         placement: this.placement,
         modifiers: [
            { name: "flip" },
            { name: "preventOverflow", options: { padding: 8 } },
         ],
      });
   }

   get placement() {
      let placement = this.getAttribute("placement") as Placement | null;

      return placement || "auto";
   }

   get trigger(): Trigger {
      switch (this.getAttribute("trigger")) {
         case "click":
            return "click";
         case "mousedown":
            return "mousedown";
         default:
            return DEFAULT_TRIGGER;
      }
   }
   set trigger(value: Trigger) {
      this.setAttribute("trigger", value);
   }

   get for() {
      return this.getAttribute("for") || "";
   }
   set for(value: string) {
      this.setAttribute("for", value);
   }

   get eatDismissClicks() {
      return this.hasAttribute("eat-dismiss-clicks");
   }
   set eatDismissClicks(value: boolean) {
      if (value) this.setAttribute("eat-dismiss-clicks", "");
      else this.removeAttribute("eat-dismiss-clicks");
   }

   get open() {
      return this.hasAttribute("open");
   }
   set open(value: boolean) {
      if (value) this.setAttribute("open", "");
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
      this.#dispatchToggleEvent();
   }

   #dispatchToggleEvent(sourceEvent?: Event) {
      this.dispatchEvent(
         new CustomEvent(MenuButtonElement.TOGGLE_EVENT, {
            bubbles: true,
            cancelable: false,
            detail: sourceEvent,
         })
      );
   }

   #getMenu() {
      let htmlFor = this.getAttribute("for");
      if (htmlFor) {
         let element = document.getElementById(htmlFor);
         if (element instanceof MenuElement) return element;
      }
      return null;
   }

   /**
    * Hide the menu whenever a menu item is selected.
    */
   #onSelection = (event: Event) => {
      this.open = false;
      this.#dispatchToggleEvent(event);
      this.focus();
   };

   /**
    * Keydown event handler for the menu:
    *  - Escape/Tab hides the menu
    */
   #onMenuKeydown = (event: Event) => {
      switch ((event as KeyboardEvent).key) {
         case "Escape":
            event.preventDefault();
            event.stopPropagation();
         // fall through
         case "Tab":
            // Do not call event.preventDefault for the Tab key. Instead, allow
            // the browser to move the focus to the next tabindex as usual.
            this.focus();
            this.open = false;
            this.#dispatchToggleEvent(event);
            break;
      }
   };

   /**
    * Toggle the menu on mouse down (not click). This allows for clicking down on the
    * menu button and releasing over the desired menuitem as with classic desktop menus.
    */
   #onMousedown = (event: MouseEvent) => {
      if (this.open) {
         this.open = false;
         this.#dispatchToggleEvent(event);
      } else {
         // Primary mouse button only
         if (event.button === 0) {
            event.preventDefault(); // allow the menu to take the focus
            this.open = true;
         }
      }
   };

   /**
    * Show or hide the menu on click.
    */
   #onClick = (event: Event) => {
      if (this.trigger === "click") {
         event.preventDefault(); // allow the menu to take the focus
         this.open = !this.open;
         this.#dispatchToggleEvent(event);
      }
   };

   /**
    * Show the menu on ArrowDown/Enter/Space keydown, focusing the first menuitem.
    */
   #onKeydown = (event: Event) => {
      switch ((event as KeyboardEvent).key) {
         case "ArrowUp":
         case "ArrowDown":
         case "Enter":
         case " ": {
            let menu = this.#getMenu();
            if (menu && !this.open) {
               event.preventDefault();
               this.open = true;
               this.#dispatchToggleEvent(event);
               menu.focusMenuItem(0);
            }
            break;
         }
      }
   };

   /**
    * Close the menu if the mouse was pressed down outside of the menu or menu button.
    */
   #onDocumentMousedown = (event: Event) => {
      let menu = this.#getMenu();
      if (!menu || !this.open) return;

      let target = event.target as Element | null;
      if (!this.contains(target) && !menu.contains(target)) {
         event.preventDefault();
         this.open = false;
         this.#dispatchToggleEvent(event);
         this.focus();

         // Prevent clicks on the document when dismissing the menu
         if (this.eatDismissClicks) {
            document.addEventListener(
               "click",
               e => {
                  e.preventDefault();
                  e.stopPropagation();
               },
               { once: true, capture: true }
            );
         }
      }
   };
}
