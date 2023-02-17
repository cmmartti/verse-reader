import ListBoxElement from "./ListBox";
import { createPopper, Placement } from "@popperjs/core";

export type Trigger = "click" | "mousedown";

export type SelectElementAttributes = {
   open?: string | null;
   for?: string | null;
   trigger?: Trigger;
   placement?: Placement;
   "eat-dismiss-clicks"?: string | null;
};

const DEFAULT_TRIGGER: Trigger = "mousedown";

export default class SelectElement extends HTMLElement {
   #internals = this.attachInternals();

   static TOGGLE_EVENT = "h-select-toggle";

   constructor() {
      super();

      // Show the listbox on mouse down. This allows for clicking down on the listbox
      // button and releasing over the desired menuitem as with classic desktop controls.
      this.addEventListener("mousedown", (event: MouseEvent) => {
         // Primary mouse button only
         if (event.button !== 0) return;

         if (this.open) {
            this.open = false;
            this.#dispatchToggleEvent();
         } else if (this.trigger === "mousedown") {
            event.preventDefault(); // allow the listbox to take the focus
            this.open = true;
         }
      });

      // Show or hide the listbox on click
      this.addEventListener("click", (event: Event) => {
         if (this.trigger === "click") {
            event.preventDefault(); // allow the listbox to take the focus
            this.open = !this.open;
            this.#dispatchToggleEvent();
         }
      });

      this.addEventListener("keydown", (event: KeyboardEvent) => {
         let listbox = this.#getListBox();
         if (!listbox) return;

         switch (event.key) {
            case "Home":
            case "End":
            case "ArrowUp":
            case "ArrowDown":
               event.preventDefault();
               if (event.key === "Home") listbox.selectedIndex = 0;
               else if (event.key === "End") listbox.selectedIndex = listbox.length - 1;
               else if (event.key === "ArrowUp") listbox.selectedIndex -= 1;
               else if (event.key === "ArrowDown")
                  if (listbox.selectedIndex < listbox.length - 1)
                     listbox.selectedIndex += 1;
               break;
            case "Enter":
            case " ":
               if (!this.open) {
                  event.preventDefault();
                  this.open = true;
                  this.#dispatchToggleEvent();
               }
               break;
         }
      });
   }

   connectedCallback() {
      // this.#internals.role = "combobox";
      this.setAttribute("role", "combobox");

      // this.#internals.ariaExpanded = this.open ? "true" : "false";
      this.setAttribute("aria-expanded", this.open ? "true" : "false");
      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;

      // let htmlFor = this.getAttribute("for");
      // if (htmlFor) this.setAttribute("aria-owns", htmlFor);

      document.addEventListener("mousedown", this.#onDocumentMousedown);

      this.#updateLabel();

      let listbox = this.#getListBox();
      if (listbox) {
         listbox.addEventListener("keydown", this.#onListBoxKeydown);
         listbox.addEventListener("mouseup", this.#onListBoxMouseup);
         listbox.addEventListener("change", this.#updateLabel);
         if (!this.open) listbox.hidden = true;
         listbox.tabIndex = -1;
         this.#attachListBox(listbox);
      }
   }

   disconnectedCallback() {
      document.removeEventListener("mousedown", this.#onDocumentMousedown);

      let listbox = this.#getListBox();
      if (listbox) {
         listbox.removeEventListener("keydown", this.#onListBoxKeydown);
         listbox.removeEventListener("mouseup", this.#onListBoxMouseup);
         listbox.removeEventListener("change", this.#updateLabel);
      }
   }

   static observedAttributes = ["placement", "open", "for"];
   attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      newValue: string | null
   ) {
      let listbox = this.#getListBox();
      if (!listbox) return;

      switch (name) {
         case "placement":
            if (this.open) this.#attachListBox(listbox);
            break;
         case "open":
            if (newValue !== null) {
               // this.#internals.ariaExpanded = "true";
               this.setAttribute("aria-expanded", "true");
               this.#attachListBox(listbox);
               listbox.hidden = false;
               listbox.focus();
            } else {
               // this.#internals.ariaExpanded = "false";
               this.setAttribute("aria-expanded", "false");
               listbox.hidden = true;
            }
            break;
         // case "for":
         //    if (newValue) this.setAttribute("aria-owns", newValue);
         //    else this.removeAttribute("aria-owns");
      }
   }

   #attachListBox(listbox: ListBoxElement) {
      if (this.placement)
         createPopper(this, listbox, {
            placement: this.placement,
            modifiers: [
               { name: "flip" },
               { name: "preventOverflow", options: { padding: 0 } },
               // { name: "offset", options: { offset: [0, 8] } },
            ],
         });
   }

   get placement() {
      return (this.getAttribute("placement") as Placement | null) || undefined;
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

   get htmlFor() {
      return this.getAttribute("for") || "";
   }
   set htmlFor(value: string) {
      this.setAttribute("for", value);
   }

   get eatDismissClicks() {
      return this.hasAttribute("eat-dismiss-clicks");
   }
   set eatDismissClicks(value: boolean) {
      this.toggleAttribute("eat-dismiss-clicks", value);
   }

   get open() {
      return this.hasAttribute("open");
   }
   set open(value: boolean) {
      this.toggleAttribute("open", value);
   }

   /**
    * Imperatively toggle the listbox open/closed. Will also dispatch a TOGGLE_EVENT.
    * (Manually opening or closing the listbox by setting the `open` property will
    * not dispatch events.)
    * @param open Whether the listbox should open or close
    */
   toggle(open: boolean) {
      this.open = open;
      this.#dispatchToggleEvent();
   }

   #dispatchToggleEvent() {
      this.dispatchEvent(
         new CustomEvent(SelectElement.TOGGLE_EVENT, {
            bubbles: true,
            cancelable: false,
         })
      );
   }

   #getListBox() {
      let htmlFor = this.getAttribute("for");
      if (htmlFor) {
         let element = document.getElementById(htmlFor);
         if (element instanceof ListBoxElement) return element;
         // else
         //    console.error(
         //       `[h-select]: h-listbox not linked because an element with ID of "${htmlFor}" was not found.`
         //    );
      }
      // console.error(
      //    `[h-select]: h-listbox not linked because the "for" attribute is missing`
      // );
      return null;
   }

   #updateLabel = () => {
      let listbox = this.#getListBox();
      if (listbox) {
         let option = listbox.querySelector(`h-option[value="${listbox.value}"]`);

         if (option) {
            let clonedNodes = [];
            for (let node of option.childNodes) clonedNodes.push(node.cloneNode(true));
            for (let label of this.querySelectorAll("h-selectlabel"))
               label.replaceChildren(...clonedNodes);
         }
      }
   };

   /**
    * Keydown event handler for the listbox:
    *  - Escape/Tab hides the listbox
    */
   #onListBoxKeydown = (event: Event) => {
      switch ((event as KeyboardEvent).key) {
         case "Enter":
         case "Escape":
            event.preventDefault();
            event.stopPropagation();
            this.focus();
            this.open = false;
            this.#dispatchToggleEvent();
            break;
         case "Tab":
            // Don't stop the focus change
            this.open = false;
            this.#dispatchToggleEvent();
            break;
      }
   };

   #onListBoxMouseup = () => {
      this.open = false;
      this.#dispatchToggleEvent();
   };

   /**
    * Close the listbox if the mouse was pressed down outside of the listbox or listbox button.
    */
   #onDocumentMousedown = (event: Event) => {
      let listbox = this.#getListBox();
      if (!listbox || !this.open) return;

      let target = event.target as Element | null;
      if (!this.contains(target) && !listbox.contains(target)) {
         event.preventDefault();
         this.open = false;
         this.#dispatchToggleEvent();
         this.focus();

         // Prevent clicks on the document when dismissing the listbox
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
