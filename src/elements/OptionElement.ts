export type ListBoxOptionElementAttributes = {
   value: string;
   selected: string | null;
};

export default class ListBoxOptionElement extends HTMLElement {
   #internals = this.attachInternals();

   connectedCallback() {
      this.#internals.role = "option";
      if (!this.hasAttribute("tabindex")) this.tabIndex = -1;
      this.#internals.ariaSelected = this.selected ? "true" : "false";
   }

   disconnectedCallback() {}

   static observedAttributes = ["selected"];
   attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      _newValue: string | null
   ) {
      switch (name) {
         case "selected":
            break;
      }
      this.connectedCallback();
   }

   get disabled() {
      return this.hasAttribute("disabled");
   }
   set disabled(value: boolean) {
      this.toggleAttribute("disabled", value);
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
