import React from "react";
import { createPopper } from "@popperjs/core";

import MenuButtonElement from "../elements/MenuButtonElement";
import MenuElement from "../elements/MenuElement";

export function Menu({
   children,
   label,
   buttonProps = {},
   trigger = "mousedown",
}: {
   children?: React.ReactNode;
   label: React.ReactNode;
   trigger?: "click" | "mousedown";
   buttonProps?: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      MenuButtonElement
   > & { class?: string; className?: never };
}) {
   let id = React.useId();

   let buttonRef = React.useRef<MenuButtonElement>(null!);
   let menuRef = React.useRef<MenuElement>(null!);

   React.useEffect(() => {
      createPopper(buttonRef.current, menuRef.current, {
         placement: "bottom-start",
         modifiers: [
            { name: "flip" },
            { name: "preventOverflow", options: { padding: 8 } },
         ],
      });
   }, []);

   let [isOpen, setIsOpen] = React.useState(false);

   React.useEffect(() => {
      let menu = menuRef.current;
      let fn = () => setIsOpen(menu.open);
      menu.addEventListener(MenuElement.TOGGLE_EVENT, fn);
      return () => menu.removeEventListener(MenuElement.TOGGLE_EVENT, fn);
   }, [menuRef]);

   return (
      <>
         <super-menu-button {...buttonProps} ref={buttonRef} for={id} trigger={trigger}>
            {label}
         </super-menu-button>
         {isOpen && (
            <div
               onClick={() => menuRef.current.toggle(false)}
               style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 99,
               }}
            ></div>
         )}

         <super-menu ref={menuRef} id={id}>
            {children}
         </super-menu>
      </>
   );
}
