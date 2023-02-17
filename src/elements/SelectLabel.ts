export type SelectLabelElementAttributes = {};

export default class SelectLabelElement extends HTMLElement {
   #internals = this.attachInternals();

   connectedCallback() {
      // this.#internals.ariaLive = "assertive";
      // this.#internals.ariaAtomic = "true";
      this.setAttribute("aria-live", "assertive");
      this.setAttribute("aria-atomic", "true");
   }
}
