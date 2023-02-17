export type OptionElementAttributes = {
   value: string;
   selected?: string | undefined;
};

export default class OptionElement extends HTMLElement {
   // #internals = this.attachInternals();

   // constructor() {
   //    super();
   //    this.#internals.role = "option";
   // }

   #defaultSelected = false;

   connectedCallback() {
      this.setAttribute("role", "option");

      if (!this.hasAttribute("tabindex")) this.tabIndex = -1;
      this.#defaultSelected = this.hasAttribute("selected");
      this.setAttribute(
         "aria-selected",
         this.hasAttribute("selected") ? "true" : "false"
      );
      // this.#internals.ariaSelected = this.hasAttribute("selected") ? "true" : "false";
   }

   disconnectedCallback() {}

   static observedAttributes = ["selected"];
   attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      newValue: string | null
   ) {
      switch (name) {
         case "selected":
            // this.#internals.ariaSelected = newValue ? "true" : "false";
            this.setAttribute("aria-selected", newValue ? "true" : "false");
            // if (typeof newValue === "string")
            //    this.dispatchEvent(
            //       new Event("change", { bubbles: true, cancelable: false })
            //    );
            break;
      }
   }

   get disabled() {
      return this.hasAttribute("disabled");
   }
   set disabled(value: boolean) {
      this.toggleAttribute("disabled", value);
   }

   get defaultSelected() {
      return this.#defaultSelected;
   }
   set defaultSelected(value: boolean) {
      this.#defaultSelected = value;
   }

   get selected() {
      return this.hasAttribute("selected");
   }
   set selected(value: boolean) {
      this.toggleAttribute("selected", value);
   }

   get value() {
      return this.getAttribute("value") ?? "";
   }
   set value(value: string) {
      this.setAttribute("value", value);
   }

   get text() {
      return this.getAttribute("label") ?? this.textContent;
   }
   set text(value: string | null) {
      if (value) this.setAttribute("label", value);
      else this.removeAttribute("label");
   }
}
