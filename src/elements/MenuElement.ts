import MenuItemElement from "./MenuItemElement";

export type MenuElementAttributes = {
   open?: string | null;
};

const SYNTHETIC_CLICK = 1827589;

/**
 * A custom element for creating rich, accessible JavaScript menus without ceding
 * control of the DOM. Does not create a Shadow DOM.
 */
export default class MenuElement extends HTMLElement {
   #internals = this.attachInternals();

   static SELECTION_EVENT = "h-menu-selection";

   constructor() {
      super();

      this.addEventListener("mousemove", this.#menuMousemove);
      this.addEventListener("mouseleave", this.#menuMouseleave);
      this.addEventListener("keydown", this.#menuKeydown);
      this.addEventListener("mouseup", this.#menuMouseup);
      this.addEventListener("click", this.#menuClick, true); // capture
   }

   connectedCallback() {
      this.#internals.role = "menu";

      // Remove child menuitems from the tab order.
      for (let item of this.items) item.tabIndex = -1;
   }

   get items() {
      return [...this.querySelectorAll("h-menuitem")] as MenuItemElement[];
   }

   get length() {
      return this.items.length;
   }

   /**
    * Focus the menuitem at `index`. A negative `index` counts backwards.
    *  0 is the first menuitem
    *  -1 is the last menuitem
    */
   focusMenuItem(index: number) {
      if (index < 0) index = this.length + index;
      index = Math.min(index, this.length - 1);
      this.items[index]?.focus();
   }

   /**
    * Dispatch a synthetic click event to the target `menuitem`.
    * @param item The menuitem element to target
    */
   #clickMenuItem(item: MenuItemElement) {
      if (
         item.hasAttribute("disabled") ||
         item.getAttribute("aria-disabled") === "true"
      ) {
         return;
      }

      // Dispatch a synthetic new click event to the target menuitem,
      // with a specific value set to the `detail` property that we can identify later.
      item.dispatchEvent(
         new MouseEvent("click", { button: 0, bubbles: true, detail: SYNTHETIC_CLICK })
      );

      this.dispatchEvent(
         new Event(MenuElement.SELECTION_EVENT, { bubbles: true, cancelable: false })
      );
   }

   /**
    * Mouseup event handler for the menu:
    *
    * Trigger a click on the menuitem under the mouse.
    * Menuitems should activate on mouseup, not click. But menuitems only have
    * click handlers, not mouseup handlers. Therefore, simulate a click on
    * the target menuitem upon mouseup to activate the click handler.
    */
   #menuMouseup = (event: MouseEvent) => {
      let target = event.target as Element | null;
      let item = target?.closest("h-menuitem");

      // Primary mouse button only (left-click)
      if (item instanceof MenuItemElement && event.button === 0) {
         event.preventDefault();
         this.#clickMenuItem(item);
      }
   };

   /**
    * Click event handler for the menu:
    *
    * Block all click events on menuitems except those dispatched by the #clickMenuItem
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
      let target = event.target as Element | null;
      let item = target?.closest("h-menuitem");

      if (item instanceof MenuItemElement) item.focus();
      else this.focus();
   };

   /**
    * Mouseleave event handler for the menu:
    *
    * Focus the menu element when the mouse leaves the menu (defocusing any menuitems).
    */
   #menuMouseleave = () => {
      this.focus();
   };

   /**
    * Keydown event handler for the menu:
    *  - ArrowUp/ArrowDown/Home/End moves focus between menuitems
    *  - Enter triggers a click on the focused menuitem
    *  - Keys matching a menuitem's `accesskey` attribute will also trigger that menuitem
    */
   #menuKeydown = (event: KeyboardEvent) => {
      let target = event.target as HTMLElement | null;

      let items = this.items;
      let currentIndex = items.findIndex(
         menuitem => menuitem === target?.closest("h-menuitem")
      );

      switch (event.key) {
         case "Enter": {
            event.preventDefault();
            let item = target?.closest("h-menuitem");
            if (item instanceof MenuItemElement) this.#clickMenuItem(item);
            break;
         }

         case "ArrowDown":
            event.preventDefault();
            this.focusMenuItem((currentIndex + 1) % items.length);
            break;
         case "ArrowUp":
            event.preventDefault();
            if (currentIndex === -1) this.focusMenuItem(items.length - 1);
            else this.focusMenuItem((currentIndex - 1 + items.length) % items.length);
            break;
         case "Home":
            event.preventDefault();
            this.focusMenuItem(0);
            break;
         case "End":
            event.preventDefault();
            this.focusMenuItem(items.length - 1);
            break;

         // // Click the first menuitem that has this key as an accesskey.
         // default: {
         //    let menuitem = this.querySelector(
         //       `h-menuitem[accesskey="${event.key}"]`
         //    ) as MenuItemElement | null;

         //    if (menuitem) {
         //       event.preventDefault();
         //       this.#clickMenuItem(menuitem, event);
         //    }
         // }
      }
   };
}
