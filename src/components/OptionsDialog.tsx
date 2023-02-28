import React from "react";

import { useOption } from "../options";
import fonts from "../fonts";
import TabContainerElement from "../elements/TabContainer";
import ListBoxElement from "../elements/ListBox";
import { ReactComponent as AddIcon } from "../icons/add.svg";
import { ReactComponent as RemoveIcon } from "../icons/remove.svg";

export function OptionsDialog({
   open,
   onClose,
}: {
   open: boolean;
   onClose: () => void;
}) {
   let [fontSize, setFontSize] = useOption("fontSize");
   let [fontFamily, setFontFamily] = useOption("fontFamily");
   let [colorScheme, setColorScheme] = useOption("colorScheme");
   let [repeatRefrain, setRepeatRefrain] = useOption("repeatRefrain");
   let [repeatChorus, setRepeatChorus] = useOption("repeatChorus");
   let [condenseRepeated, setCondenseRepeated] = useOption("condenseRepeatedLines");
   let [hyphenation, setHyphenation] = useOption("hyphenation");
   let [pageMargins, setPageMargins] = useOption("pageMargins");
   let [lineHeight, setLineHeight] = useOption("lineHeight");
   let [paragraphSpacing, setParagraphSpacing] = useOption("paragraphSpacing");
   let [separatorColor, setSeparatorColor] = useOption("separatorColor");
   let [currentTab, setCurrentTab] = useOption("currentTab");

   let resetToDefault = () => {
      setFontSize();
      setFontFamily();
      setRepeatRefrain();
      setRepeatChorus();
      setCondenseRepeated();
      setPageMargins();
      setLineHeight();
      setParagraphSpacing();
      setHyphenation();
      setSeparatorColor();
   };

   let tabContainerRef = React.useRef<TabContainerElement>(null);

   React.useEffect(() => {
      let tabContainer = tabContainerRef.current;

      let fn = (e: Event) => {
         let tab = (e as CustomEvent).detail.relatedTarget as HTMLElement;
         let tabId = tab.getAttribute("data-tab-id");
         if (tabId) setCurrentTab(tabId as "font" | "format" | "layout");
      };
      tabContainer?.addEventListener(TabContainerElement.CHANGED_EVENT, fn);
      return () =>
         tabContainer?.removeEventListener(TabContainerElement.CHANGED_EVENT, fn);
   }, [setCurrentTab]);

   let listboxRef = React.useRef<ListBoxElement>(null);

   React.useEffect(() => {
      let listbox = listboxRef.current;

      let fn = (e: Event) => {
         if (e.target instanceof ListBoxElement) {
            let selected = [...e.target.selectedOptions];
            if (selected[0]) setFontFamily(selected[0].getAttribute("value") ?? "");
         }
      };
      listbox?.addEventListener("change", fn);
      return () => listbox?.removeEventListener("change", fn);
   }, [setFontFamily]);

   let dialogRef = React.useRef<HTMLDialogElement>(null);

   React.useEffect(() => {
      function onMousedown(event: Event) {
         if (
            event.target instanceof Node &&
            !dialogRef.current?.contains(event.target)
         ) {
            dialogRef.current?.close();
         }
      }

      if (open && !dialogRef.current?.open) {
         dialogRef.current?.showModal();
         document.addEventListener("mousedown", onMousedown);
      }

      if (!open) {
         dialogRef.current?.close();
         document.removeEventListener("mousedown", onMousedown);
      }

      return () => document.removeEventListener("mousedown", onMousedown);
   }, [open]);

   let htmlId = React.useId();

   return (
      <dialog className="OptionsDialog" ref={dialogRef} onClose={onClose}>
         <form method="dialog" className="display-contents">
            <tab-container ref={tabContainerRef} class="OptionsDialog-tabContainer">
               <div role="tablist">
                  <button
                     type="button"
                     id={htmlId + "font"}
                     role="tab"
                     aria-selected={currentTab === "font"}
                     autoFocus={currentTab === "font"}
                  >
                     Font
                  </button>
                  <button
                     type="button"
                     id={htmlId + "format"}
                     role="tab"
                     aria-selected={currentTab === "format"}
                     autoFocus={currentTab === "format"}
                  >
                     Format
                  </button>
                  <button
                     type="button"
                     id={htmlId + "layout"}
                     role="tab"
                     aria-selected={currentTab === "layout"}
                     autoFocus={currentTab === "layout"}
                  >
                     Layout
                  </button>
               </div>

               <div
                  role="tabpanel"
                  data-tab-id="font"
                  aria-labelledby={htmlId + "font"}
                  hidden={currentTab !== "font"}
                  data-tab-container-no-tabstop
                  className="OptionsDialog-page"
               >
                  <h-listbox
                     id={htmlId + "fontFamily"}
                     // auto-select=""
                     class="ListBox"
                     ref={listboxRef}
                     aria-label="Font"
                  >
                     {fonts.map(font => (
                        <h-option
                           key={font.id}
                           value={font.id}
                           selected={fontFamily === font.id ? "" : undefined}
                        >
                           <span style={{ fontFamily: font.value }}>{font.name}</span>
                        </h-option>
                     ))}
                  </h-listbox>

                  <Range
                     id={htmlId + "fontSize"}
                     value={fontSize}
                     step={2}
                     min={12}
                     max={36}
                     onChange={value => setFontSize(value)}
                     inputProps={{
                        "aria-label": "Font Size",
                        title: "Font Size",
                        list: htmlId + "fontFamilyTickmarks",
                     }}
                     minusLabel={<span style={{ fontSize: 16 }}>A</span>}
                     plusLabel="A"
                     ticks={[
                        { value: 12 },
                        { value: 16 },
                        { value: 20, label: "20" },
                        { value: 24 },
                        { value: 28 },
                        { value: 32 },
                        { value: 36 },
                     ]}
                  />
               </div>

               <div
                  role="tabpanel"
                  data-tab-id="format"
                  aria-labelledby={htmlId + "format"}
                  hidden={currentTab !== "format"}
                  data-tab-container-no-tabstop
                  className="OptionsDialog-page"
               >
                  <div id={htmlId + "background"}>Background:</div>
                  <div
                     className="OptionsDialog-radiogroup"
                     role="radiogroup"
                     aria-labelledby={htmlId + "background"}
                  >
                     <label>
                        <input
                           type="radio"
                           name="colorScheme"
                           value="light"
                           checked={"light" === colorScheme}
                           onChange={() => setColorScheme("light")}
                        />
                        White
                     </label>
                     <label>
                        <input
                           type="radio"
                           name="colorScheme"
                           value="dark"
                           checked={"dark" === colorScheme}
                           onChange={() => setColorScheme("dark")}
                        />
                        Black
                     </label>
                     <label>
                        <input
                           type="radio"
                           name="colorScheme"
                           value="system"
                           checked={"system" === colorScheme}
                           onChange={() => setColorScheme("system")}
                        />
                        Auto
                     </label>
                  </div>

                  <hr />

                  <div id={htmlId + "line-marker"}>Line Marker:</div>
                  <div
                     className="OptionsDialog-radiogroup"
                     role="radiogroup"
                     aria-labelledby={htmlId + "line-marker"}
                  >
                     <label>
                        <input
                           type="radio"
                           name="separatorColor"
                           value="gray"
                           checked={"gray" === separatorColor}
                           onChange={() => setSeparatorColor("gray")}
                        />
                        Gray
                     </label>
                     <label>
                        <input
                           type="radio"
                           name="separatorColor"
                           value="red"
                           checked={"red" === separatorColor}
                           onChange={() => setSeparatorColor("red")}
                        />
                        Red
                     </label>
                     <label>
                        <input
                           type="radio"
                           name="separatorColor"
                           value="off"
                           checked={"off" === separatorColor}
                           onChange={() => setSeparatorColor("off")}
                        />
                        Off
                     </label>
                  </div>

                  <hr />

                  <label className="-checkbox">
                     <input
                        type="checkbox"
                        checked={repeatRefrain}
                        onChange={e => setRepeatRefrain(e.target.checked)}
                     />
                     Repeat refrain
                  </label>

                  <label className="-checkbox">
                     <input
                        type="checkbox"
                        checked={repeatChorus}
                        onChange={e => setRepeatChorus(e.target.checked)}
                     />
                     Repeat chorus
                  </label>

                  <label className="-checkbox">
                     <input
                        type="checkbox"
                        aria-label="Condense repeated lines. Does not affect screen readers."
                        checked={condenseRepeated}
                        onChange={e => setCondenseRepeated(e.target.checked)}
                     />
                     Condense repeated lines
                  </label>

                  <hr />

                  <label className="-checkbox">
                     <input
                        type="checkbox"
                        checked={hyphenation}
                        onChange={e => setHyphenation(e.target.checked)}
                     />
                     Hyphenation
                  </label>
               </div>

               <div
                  role="tabpanel"
                  data-tab-id="layout"
                  aria-labelledby={htmlId + "layout"}
                  hidden={currentTab !== "layout"}
                  data-tab-container-no-tabstop
                  className="OptionsDialog-page"
               >
                  <label htmlFor={htmlId + "pageMargins"}>Margins ({pageMargins})</label>
                  <Range
                     id={htmlId + "pageMargins"}
                     min={15}
                     max={65}
                     step={10}
                     ticks={[
                        { value: 15 },
                        { value: 25 },
                        { value: 35 },
                        { value: 45 },
                        { value: 55 },
                        { value: 65 },
                        { value: 75 },
                     ]}
                     value={pageMargins}
                     onChange={value => setPageMargins(+value.toFixed(1))}
                  />

                  <hr />

                  <label htmlFor={htmlId + "leading"}>Leading ({lineHeight})</label>
                  <Range
                     id={htmlId + "leading"}
                     min={1}
                     max={2}
                     step={0.1}
                     ticks={[
                        { value: 1 },
                        { value: 1.2 },
                        { value: 1.4 },
                        { value: 1.6 },
                        { value: 1.8 },
                        { value: 2 },
                     ]}
                     value={lineHeight}
                     onChange={value => setLineHeight(+value.toFixed(1))}
                  />

                  <hr />

                  <label htmlFor={htmlId + "paragraphSpacing"}>
                     Verse Spacing ({paragraphSpacing})
                  </label>
                  <Range
                     id={htmlId + "paragraphSpacing"}
                     min={0}
                     max={1}
                     step={0.1}
                     ticks={[
                        { value: 0 },
                        { value: 0.2 },
                        { value: 0.4 },
                        { value: 0.6 },
                        { value: 0.8 },
                        { value: 1 },
                     ]}
                     value={paragraphSpacing}
                     onChange={value => setParagraphSpacing(+value.toFixed(2))}
                  />
               </div>
            </tab-container>

            <div className="OptionsDialog-footer">
               <button
                  type="button"
                  onClick={() => {
                     if (
                        window.confirm(
                           `Are you sure you want to reset the display options to default settings?`
                        )
                     )
                        resetToDefault();
                  }}
               >
                  Reset
               </button>
               <button type="submit">
                  <b>Done</b>
               </button>
            </div>
         </form>
      </dialog>
   );
}

function Range({
   id,
   plusLabel = <AddIcon />,
   minusLabel = <RemoveIcon />,
   ticks,
   inputProps,
   onChange,
   value,
   min,
   max,
   step,
}: {
   id: string;
   plusLabel?: React.ReactNode;
   minusLabel?: React.ReactNode;
   onChange?: (value: number) => void;
   value: number;
   min: number;
   max: number;
   step: number;
   ticks?: { value: number; label?: string }[];
   inputProps?: Omit<
      React.DetailedHTMLProps<
         React.InputHTMLAttributes<HTMLInputElement>,
         HTMLInputElement
      >,
      "value" | "onChange" | "min" | "max" | "step"
   >;
}) {
   let htmlId = React.useId();

   return (
      <div className="OptionsDialog-range">
         <button
            type="button"
            className="-button"
            aria-hidden
            tabIndex={-1}
            onClick={() => onChange?.(Math.max(min, Math.min(max, value) - step))}
         >
            {minusLabel}
         </button>

         <input
            {...inputProps}
            id={id}
            list={ticks ? htmlId + "datalist" : undefined}
            type="range"
            value={value}
            onChange={event => onChange?.(Number(event.target.value))}
            min={min}
            max={max}
            step={step}
         />
         {ticks && (
            <datalist id={htmlId + "datalist"}>
               {ticks.map(tick => (
                  <option key={tick.value} value={tick.value} label={tick.label} />
               ))}
            </datalist>
         )}

         <button
            type="button"
            className="-button"
            aria-hidden
            tabIndex={-1}
            onClick={() => onChange?.(Math.min(max, Math.max(min, value) + step))}
         >
            {plusLabel}
         </button>
      </div>
   );
}
