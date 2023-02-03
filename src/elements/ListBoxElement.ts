import OptionElement from "./OptionElement";

export type ListBoxElementAttributes = {
   "auto-select"?: string | null;
};

export default class ListBoxElement extends HTMLElement {
   static formAssociated = true;

   #internals = this.attachInternals();

   constructor() {
      super();

      this.addEventListener("mousedown", () => {
         this.addEventListener("mouseup", onMouseup, { once: true });
      });

      let onMouseup = (event: MouseEvent) => {
         let target = event.target as Element | null;
         let option = target?.closest("h-option");

         // Primary mouse button only (left-click)
         if (option instanceof OptionElement && !option.disabled && event.button === 0) {
            event.preventDefault();
            this.#selectOption(option);
         }
      };

      let preventRefocus = false;

      this.addEventListener("focus", () => {
         if (!preventRefocus) {
            let selectedOption = this.querySelector("h-option[selected]");
            if (selectedOption instanceof OptionElement) selectedOption.focus();
         }
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
               if (this.autoSelect) this.#selectOption(option);
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
                  this.#selectOption(currentOption);
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

      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
      for (let option of this.options) option.tabIndex = -1;
      if (this.selectedIndex === -1) this.selectedIndex = 0;
      this.#internals.setFormValue(this.value);
   }

   get autoSelect() {
      return this.hasAttribute("auto-select");
   }
   set autoSelect(value: boolean) {
      this.toggleAttribute("auto-select", value);
   }

   get value() {
      let option = this.querySelector("h-option[selected]");
      if (option instanceof OptionElement) return option.value;
      else return "";
   }
   set value(value: string) {
      for (let option of this.options) option.selected = option.value === value;
      this.#internals.setFormValue(this.value);
   }

   get selectedIndex() {
      let selectedOption = this.querySelector("h-option[selected]");
      let options = [...this.querySelectorAll("h-option")];
      return options.findIndex(option => option === selectedOption);
   }
   set selectedIndex(index: number) {
      if (index >= 0) {
         let option = this.options[index];
         if (option) this.#selectOption(option);
      }
   }

   get options() {
      return [...this.querySelectorAll("h-option")] as OptionElement[];
   }

   get selectedOptions() {
      return [...this.querySelectorAll("h-option[selected]")] as OptionElement[];
   }

   get length() {
      return this.options.length;
   }

   #selectOption(option: OptionElement) {
      let options = this.options;
      for (let o of options) if (option !== o) o.selected = false;
      option.selected = true;

      this.dispatchEvent(
         new CustomEvent("change", { bubbles: true, cancelable: false })
      );
   }
}
