import React from "react";
import { createPopper, Placement } from "@popperjs/core";

import MenuButtonElement from "../elements/MenuButtonElement";
import MenuElement from "../elements/MenuElement";

export function Menu({
   children,
   label,
   buttonProps = {},
   trigger = "mousedown",
   placement = "bottom-start",
}: {
   children?: React.ReactNode;
   label: React.ReactNode;
   trigger?: "click" | "mousedown";
   placement?: Placement;
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
         placement: placement,
         modifiers: [
            { name: "flip" },
            { name: "preventOverflow", options: { padding: 8 } },
         ],
      });
   }, [placement]);

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

         <super-menu ref={menuRef} id={id} class="Menu">
            {children}
         </super-menu>
      </>
   );
}
