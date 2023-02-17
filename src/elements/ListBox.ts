import OptionElement from "./Option";

export type ListBoxElementAttributes = {
   "auto-select"?: string | null;
   name?: string;
};

export default class ListBoxElement extends HTMLElement {
   static formAssociated = true;

   #internals = this.attachInternals();

   constructor() {
      super();

      let onMouseup = (event: MouseEvent) => {
         let target = event.target as Element | null;
         let option = target?.closest("h-option");

         // Primary mouse button only (left-click)
         if (option instanceof OptionElement && !option.disabled && event.button === 0) {
            event.preventDefault();
            this.value = option.getAttribute("value") ?? "";
         }
      };
      this.addEventListener("mouseup", onMouseup);

      // this.addEventListener("mousedown", () => {
      //    this.addEventListener("mouseup", onMouseup, { once: true });
      // });

      let preventRefocus = false;

      this.addEventListener("focus", () => {
         if (!preventRefocus) this.selectedOptions[0]?.focus();
         preventRefocus = false; // reset each time
      });

      this.addEventListener("keydown", event => {
         let target = event.target as HTMLElement | null;
         if (!target) return;

         if (this.length === 0) return;

         let options = this.options;
         let currentOption = target?.closest("h-option");
         let currentIndex = options.findIndex(option => option === currentOption);
         let lastIndex = options.length - 1;

         switch (event.key) {
            case "ArrowDown":
            case "ArrowUp":
            case "Home":
            case "End": {
               event.preventDefault();

               let index = 0;
               if ("ArrowDown" === event.key)
                  index = Math.min(lastIndex, currentIndex + 1);
               else if ("ArrowUp" === event.key) index = Math.max(0, currentIndex - 1);
               else if ("Home" === event.key) index = 0;
               else if ("End" === event.key) index = lastIndex;

               let option = options[index]!;
               if (this.autoSelect) this.value = option.getAttribute("value") ?? "";
               option.focus();
               option.scrollIntoView({ block: "nearest" });
               break;
            }
            case "Tab":
               // Do not prevent default - allow the browser to move the focus
               preventRefocus = true;
               this.focus();
               break;
            case "Enter": {
               event.preventDefault();
               if (currentOption instanceof OptionElement && !currentOption.disabled)
                  this.value = currentOption.value;
               break;
            }
            default:
               // TODO: Type-ahead selection
               break;
         }
      });
   }

   connectedCallback() {
      this.#internals.role = "listbox";
      this.setAttribute("role", "listbox");
      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
      if (this.selectedIndex === -1) this.selectedIndex = 0;

      this.#internals.setFormValue(this.value);
   }

   get autoSelect() {
      return this.hasAttribute("auto-select");
   }

   set autoSelect(value: boolean) {
      this.toggleAttribute("auto-select", value);
   }

   get options() {
      return [...this.querySelectorAll("h-option")] as HTMLElement[];
   }

   get selectedOptions() {
      return [...this.querySelectorAll("h-option[selected]")] as HTMLElement[];
   }

   get length() {
      return this.options.length;
   }

   get form() {
      return this.#internals.form;
   }

   get name() {
      return this.getAttribute("name");
   }

   get type() {
      return this.localName;
   }

   get value() {
      return this.querySelector("h-option[selected]")?.getAttribute("value") ?? "";
   }

   set value(value: string) {
      let option = this.querySelector(`h-option[value="${value}"]`);
      if (option) {
         for (let option of this.options) {
            let isSelected = option.getAttribute("value") === value;
            option.toggleAttribute("selected", isSelected);
         }
         this.#internals.setFormValue(this.value);

         this.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
      }
   }

   get selectedIndex() {
      return this.options.findIndex(option => option.hasAttribute("selected"));
   }

   set selectedIndex(index: number) {
      this.value = this.options[index]?.getAttribute("value") ?? "";
   }
}
