export type MenuItemElementAttributes = (
   | { type: "button" }
   | { type: "radio"; checked: string | null }
   | { type: "checkbox"; checked: string | null }
) & { disabled?: string | null };

export default class MenuItemElement extends HTMLElement {
   #internals = this.attachInternals();

   connectedCallback() {
      if (!this.hasAttribute("tabindex")) this.tabIndex = -1;

      // if (this.type === "button") this.#internals.role = "menuitem";
      // else if (this.type === "radio") this.#internals.role = "menuitemradio";
      // else if (this.type === "checkbox") this.#internals.role = "menuitemcheckbox";
      if (this.type === "button") this.setAttribute("role", "menuitem");
      else if (this.type === "radio") this.setAttribute("role", "menuitemradio");
      else if (this.type === "checkbox") this.setAttribute("role", "menuitemcheckbox");

      // this.#internals.ariaDisabled = this.disabled ? "true" : "false";
      this.setAttribute("aria-disabled", this.disabled ? "true" : "false");

      if (this.type === "radio" || this.type === "checkbox") {
         // this.#internals.ariaChecked = this.checked ? "true" : "false";
         this.setAttribute("aria-checked", this.checked ? "true" : "false");
      }
   }

   disconnectedCallback() {}

   static observedAttributes = ["type", "checked", "disabled"];
   attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      _newValue: string | null
   ) {
      switch (name) {
         case "type":
         case "checked":
         case "disabled":
            this.connectedCallback();
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
