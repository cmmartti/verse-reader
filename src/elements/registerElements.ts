import MenuElement, { MenuElementAttributes } from "./MenuElement";
import MenuButtonElement, { MenuButtonElementAttributes } from "./MenuButtonElement";
import DialogElement, { DialogElementAttributes } from "./DialogElement";

export function registerElements() {
    customElements.define("super-dialog", DialogElement);
    customElements.define("super-menu", MenuElement);
    customElements.define("super-menu-button", MenuButtonElement);
}

declare global {
    namespace JSX {
        interface IntrinsicElements {
            "super-dialog": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                DialogElement
            > &
                DialogElementAttributes & { class?: string; className?: never };

            "super-menu": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                MenuElement
            > &
                MenuElementAttributes & { class?: string; className?: never };

            "super-menu-button": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                MenuButtonElement
            > &
                MenuButtonElementAttributes & { class?: string; className?: never };
        }
    }
}
