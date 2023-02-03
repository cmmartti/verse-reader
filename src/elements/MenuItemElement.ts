export type MenuItemElementAttributes = (
   | { type: "button" }
   | { type: "radio"; checked: string | null }
   | { type: "checkbox"; checked: string | null }
) & { disabled?: string | null };

export default class MenuItemElement extends HTMLElement {
   #internals = this.attachInternals();

   connectedCallback() {
      if (!this.hasAttribute("tabindex")) this.tabIndex = -1;

      if (this.type === "button") this.#internals.role = "menuitem";
      else if (this.type === "radio") this.#internals.role = "menuitemradio";
      else if (this.type === "checkbox") this.#internals.role = "menuitemcheckbox";

      this.#internals.ariaDisabled = this.disabled ? "true" : "false";

      if (this.type === "radio" || this.type === "checkbox")
         this.#internals.ariaChecked = this.checked ? "true" : "false";
   }

   disconnectedCallback() {}

   static observedAttributes = ["type", "checked", "disabled"];
   attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      newValue: string | null
   ) {
      switch (name) {
         case "type":
            if (newValue === "button") this.#internals.role = "menuitem";
            else if (newValue === "radio") this.#internals.role = "menuitemradio";
            else if (newValue === "checkbox") this.#internals.role = "menuitemcheckbox";
            break;
         case "checked":
            if (this.type === "radio" || this.type === "checkbox")
               this.#internals.ariaChecked = newValue ? "true" : "false";
            break;
         case "disabled":
            this.#internals.ariaDisabled = newValue ? "true" : "false";
      }
   }

   get disabled() {
      return this.hasAttribute("disabled");
   }
   set disabled(value: boolean) {
      this.toggleAttribute("disabled", value);
   }

   get checked() {
      if (this.type === "radio" || this.type === "checkbox")
         return this.hasAttribute("checked");
      return false;
   }
   set checked(value: boolean) {
      if (this.type === "radio" || this.type === "checkbox")
         this.toggleAttribute("checked", value);
   }

   get type() {
      return (
         (this.getAttribute("value") as "button" | "radio" | "checkbox" | null) ??
         "button"
      );
   }
   set type(value: "button" | "radio" | "checkbox") {
      this.setAttribute("type", value);
   }
}
