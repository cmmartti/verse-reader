import "element-internals-polyfill";

import MenuElement, { MenuElementAttributes } from "./MenuElement";
import MenuItemElement, { MenuItemElementAttributes } from "./MenuItemElement";
import ListBoxElement, { ListBoxElementAttributes } from "./ListBoxElement";
import OptionElement, { ListBoxOptionElementAttributes } from "./OptionElement";
import SelectElement, { SelectElementAttributes } from "./SelectElement";
import MenuButtonElement, { MenuButtonElementAttributes } from "./MenuButtonElement";
import DialogElement, { DialogElementAttributes } from "./DialogElement";
import SwitchElement, { SwitchElementAttributes } from "./SwitchElement";
import TabContainerElement from "./TabContainerElement";

export default function registerElements() {
   customElements.define("h-dialog", DialogElement);
   customElements.define("h-menu", MenuElement);
   customElements.define("h-menuitem", MenuItemElement);
   customElements.define("h-listbox", ListBoxElement);
   customElements.define("h-option", OptionElement);
   customElements.define("h-select", SelectElement);
   customElements.define("h-menubutton", MenuButtonElement);
   customElements.define("h-switch", SwitchElement);

   customElements.define("tab-container", TabContainerElement);
}

declare global {
   namespace JSX {
      interface IntrinsicElements {
         "h-dialog": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            DialogElement
         > &
            DialogElementAttributes & { class?: string; className?: never };

         "h-menu": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            MenuElement
         > &
            MenuElementAttributes & { class?: string; className?: never };

         "h-menuitem": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            MenuItemElement
         > &
            MenuItemElementAttributes & {
               class?: string;
               className?: never;
            };

         "h-listbox": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            ListBoxElement
         > &
            ListBoxElementAttributes & { class?: string; className?: never };

         "h-option": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            OptionElement
         > &
            ListBoxOptionElementAttributes & { class?: string; className?: never };

         "h-select": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            SelectElement
         > &
            SelectElementAttributes & { class?: string; className?: never };

         "h-menubutton": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            MenuButtonElement
         > &
            MenuButtonElementAttributes & { class?: string; className?: never };

         "h-switch": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            SwitchElement
         > &
            SwitchElementAttributes & { class?: string; className?: never };

         "tab-container": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            TabContainerElement
         > & { class?: string; className?: never };
      }
   }
}
