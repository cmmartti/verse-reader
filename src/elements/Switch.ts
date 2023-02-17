export type SwitchElementAttributes = {
   checked?: string | null;
   value?: string | null;
   disabled?: string | null;
};

export default class SwitchElement extends HTMLElement {
   static formAssociated = true;

   #internals = this.attachInternals();
   #disabled = this.matches(":disabled");

   constructor() {
      super();

      this.addEventListener("click", this.#onClick);
      this.addEventListener("keydown", this.#onKeydown);
   }

   connectedCallback() {
      this.#internals.role = "switch";
      this.#internals.setFormValue(this.checked ? this.value : null);
      this.#internals.ariaChecked = this.checked ? "true" : "false";

      if (!this.hasAttribute("tabindex")) this.tabIndex = 0;
   }

   static observedAttributes = ["checked", "value", "required"];
   attributeChangedCallback(
      name: string,
      _oldValue: string | null,
      newValue: string | null
   ) {
      switch (name) {
         case "checked":
            this.checked = newValue != null;
            break;
         case "value":
            if (newValue !== this.value) this.value = newValue ?? "on";
            break;
         case "required":
            if (newValue == null || this.checked) this.#internals.setValidity({});
            else
               this.#internals.setValidity(
                  { valueMissing: true },
                  newValue || "Must check this box",
                  this.#internals.form
               );
      }
      this.connectedCallback();
   }

   formDisabledCallback(state: boolean) {
      this.#disabled = state;
   }

   get checked() {
      return this.hasAttribute("checked");
   }
   set checked(x: boolean) {
      this.toggleAttribute("checked", x);
   }
   get value() {
      return this.getAttribute("value") ?? "on";
   }
   set value(v: string) {
      this.setAttribute("value", v);
   }

   #onClick() {
      if (!this.#disabled) this.#toggle();
   }

   #onKeydown(event: KeyboardEvent) {
      switch (event.key) {
         case " ":
            event.preventDefault();
            if (!this.#disabled) this.#toggle();
            break;
      }
   }

   #toggle() {
      this.checked = !this.checked;
      this.dispatchEvent(new Event("change", { bubbles: true, cancelable: false }));
   }
}
