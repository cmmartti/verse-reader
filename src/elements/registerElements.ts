import "element-internals-polyfill";

import MenuElement, { MenuElementAttributes } from "./Menu";
import MenuItemElement, { MenuItemElementAttributes } from "./MenuItem";
import ListBoxElement, { ListBoxElementAttributes } from "./ListBox";
import OptionElement, { OptionElementAttributes } from "./Option";
import SelectElement, { SelectElementAttributes } from "./Select";
import SelectLabelElement, { SelectLabelElementAttributes } from "./SelectLabel";
import MenuButtonElement, { MenuButtonElementAttributes } from "./MenuButton";
import DialogElement, { DialogElementAttributes } from "./Dialog";
import SwitchElement, { SwitchElementAttributes } from "./Switch";
import TabContainerElement from "./TabContainer";

export default function registerElements() {
   customElements.define("h-dialog", DialogElement);
   customElements.define("h-menu", MenuElement);
   customElements.define("h-menuitem", MenuItemElement);
   customElements.define("h-listbox", ListBoxElement);
   customElements.define("h-option", OptionElement);
   customElements.define("h-select", SelectElement);
   customElements.define("h-selectlabel", SelectLabelElement);
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
            OptionElementAttributes & { class?: string; className?: never };

         "h-select": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            SelectElement
         > &
            SelectElementAttributes & { class?: string; className?: never };

         "h-selectlabel": React.DetailedHTMLProps<
            React.HTMLAttributes<HTMLElement>,
            SelectLabelElement
         > &
            SelectLabelElementAttributes & { class?: string; className?: never };

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
