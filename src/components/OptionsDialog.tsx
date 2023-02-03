import React from "react";

import { Options, useOption } from "../options";
import fonts from "../fonts";
import TabContainerElement from "../elements/TabContainerElement";
import ListBoxElement from "../elements/ListBoxElement";
import SwitchElement, { SwitchElementAttributes } from "../elements/SwitchElement";
import { RadioButtons } from "./RadioButtons";

export function OptionsDialog({
   open,
   onClose,
}: {
   open: boolean;
   onClose: () => void;
}) {
   let [fontSize, setFontSize] = useOption("fontSize");
   let [fontFamily, setFontFamily] = useOption("fontFamily");
   let currentFont = fonts.find(font => font.id === fontFamily);
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

   let tabContainerRef = React.useRef<TabContainerElement>(null!);

   React.useEffect(() => {
      let tabContainer = tabContainerRef.current;
      if (!tabContainer) return;

      let fn = (e: Event) => {
         let tab = (e as CustomEvent).detail.relatedTarget as HTMLElement;
         let tabId = tab.getAttribute("data-tab-id");
         if (tabId) setCurrentTab(tabId as "font" | "format" | "layout");
      };
      tabContainer.addEventListener(TabContainerElement.CHANGED_EVENT, fn);
      return () =>
         tabContainer.removeEventListener(TabContainerElement.CHANGED_EVENT, fn);
   }, [setCurrentTab]);

   let listboxRef = React.useRef<ListBoxElement>(null!);

   React.useEffect(() => {
      let listbox = listboxRef.current;
      if (!listbox) return;

      let fn = (e: Event) => {
         if (e.target instanceof ListBoxElement) {
            let selected = [...e.target.selectedOptions];
            if (selected[0]) setFontFamily(selected[0].value);
         }
      };
      listbox.addEventListener("change", fn);
      return () => listbox.removeEventListener("change", fn);
   }, [setFontFamily]);

   let dialogRef = React.useRef<HTMLDialogElement>(null!);

   React.useEffect(() => {
      function onMousedown(event: MouseEvent) {
         if (event.target instanceof Node && !dialogRef.current.contains(event.target)) {
            dialogRef.current.close();
         }
      }

      if (open && !dialogRef.current.open) {
         dialogRef.current.showModal();
         document.addEventListener("mousedown", onMousedown);
      }

      if (!open) {
         dialogRef.current.close();
         document.removeEventListener("mousedown", onMousedown);
      }

      return () => document.removeEventListener("mousedown", onMousedown);
   }, [open]);

   let htmlId = React.useId();

   return (
      <dialog className="OptionsDialog" ref={dialogRef} onClose={onClose}>
         <tab-container ref={tabContainerRef}>
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
            >
               {/* <h-select
                     class="Select"
                     for={htmlId + "fontFamily"}
                     eat-dismiss-clicks=""
                     placement="bottom-start"
                     aria-label="Font"
                     style={{ fontFamily: currentFont?.value }}
                  >
                     <span aria-hidden>{currentFont?.name ?? fontFamily}</span>
                  </h-select> */}

               <h-listbox
                  id={htmlId + "fontFamily"}
                  auto-select=""
                  class="ListBox"
                  ref={listboxRef}
                  aria-label="Font"
                  // role="listbox"
               >
                  {fonts.map(font => (
                     <h-option
                        key={font.id}
                        value={font.id}
                        selected={fontFamily === font.id ? "" : null}
                     >
                        {fontFamily === font.id && (
                           <span aria-hidden className="-marker">
                              ✓
                           </span>
                        )}
                        <span style={{ fontFamily: font.value }}>{font.name}</span>
                     </h-option>
                  ))}
               </h-listbox>

               <RangeInput
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
                  minusLabel={<span style={{ fontSize: 12 }}>A</span>}
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
            >
               <div className="-stack">
                  <div className="-row">
                     <label htmlFor={htmlId + "repeatRefrain"}>Repeat refrain</label>
                     <Switch
                        id={htmlId + "repeatRefrain"}
                        checked={repeatRefrain ? "" : null}
                        onChange={e =>
                           setRepeatRefrain((e.target as SwitchElement).checked)
                        }
                     />
                  </div>
                  <div className="-row">
                     <label htmlFor={htmlId + "repeatChorus"}>Repeat chorus</label>
                     <Switch
                        id={htmlId + "repeatChorus"}
                        checked={repeatChorus ? "" : null}
                        onChange={e =>
                           setRepeatChorus((e.target as SwitchElement).checked)
                        }
                     />
                  </div>
                  <div className="-row">
                     <label htmlFor={htmlId + "condenseRepeated"}>
                        Condense repeated lines
                     </label>
                     <Switch
                        aria-label="Condense repeated lines. Does not affect screen readers."
                        id={htmlId + "condenseRepeated"}
                        checked={condenseRepeated ? "" : null}
                        onChange={e =>
                           setCondenseRepeated((e.target as SwitchElement).checked)
                        }
                     />
                  </div>
                  <div className="-row">
                     <label htmlFor={htmlId + "hyphenation"}>Hyphenation</label>
                     <Switch
                        id={htmlId + "hyphenation"}
                        checked={hyphenation ? "" : null}
                        onChange={e =>
                           setHyphenation((e.target as SwitchElement).checked)
                        }
                     />
                  </div>
                  <div className="-row">
                     <label htmlFor={htmlId + "separatorColor"}>Line Marker</label>
                     <fieldset className="-radioSet" title="Color Scheme">
                        <RadioButtons
                           name="color-scheme"
                           value={separatorColor}
                           options={[
                              { value: "red", children: "Red" },
                              { value: "gray", children: "Grey" },
                              { value: "off", children: "Off" },
                           ]}
                           onChange={value =>
                              setSeparatorColor(value as Options["separatorColor"])
                           }
                        />
                     </fieldset>
                  </div>
               </div>
            </div>

            <div
               role="tabpanel"
               data-tab-id="layout"
               aria-labelledby={htmlId + "layout"}
               hidden={currentTab !== "layout"}
               data-tab-container-no-tabstop
            >
               <RangeInput
                  label={`Margins (${pageMargins})`}
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
               <RangeInput
                  label={`Leading (${lineHeight})`}
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
               <RangeInput
                  label={`Verse Spacing (${paragraphSpacing})`}
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

         <form method="dialog" className="-footer">
            <button type="button" onClick={resetToDefault}>
               Reset
            </button>
            <button type="submit">
               <b>Done</b>
            </button>
         </form>

         {/* <div
            className="-backdrop"
            onClick={() => dialogRef.current.close()}
            style={{ zIndex: -1, position: "fixed", inset: 0 }}
         /> */}
      </dialog>
   );
}

function Switch2(
   props: React.DetailedHTMLProps<
      React.InputHTMLAttributes<HTMLInputElement>,
      HTMLInputElement
   >
) {
   return (
      <div className="Switch" data-checked={props.checked}>
         <input type="checkbox" role="switch" {...props} />
         {props.checked ? "On" : "Off"}
      </div>
   );
}

function Switch(
   props: Omit<
      React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, SwitchElement>,
      "onChange"
   > &
      SwitchElementAttributes & {
         onChange: (event: Event) => void;
         class?: string;
         className?: never;
      }
) {
   let ref = React.useRef<SwitchElement>(null!);
   let { onChange, ...attributes } = props;

   React.useEffect(() => {
      let element = ref.current;
      let fn = (event: Event) => onChange?.(event);
      element.addEventListener("change", fn);
      return () => element.removeEventListener("change", fn);
   }, [onChange]);

   let checked = typeof props.checked === "string";

   return (
      <h-switch ref={ref} {...attributes} class="Switch" tabIndex={0}>
         <span aria-hidden className={"-option" + (!checked ? " --checked" : "")}>
            No
         </span>
         <span aria-hidden className={"-option" + (checked ? " --checked" : "")}>
            Yes
         </span>
      </h-switch>
   );
}

function RangeInput({
   plusLabel = "+",
   minusLabel = "-",
   label,
   ticks,
   inputProps,
   onChange,
   value,
   min,
   max,
   step,
}: {
   plusLabel?: React.ReactNode;
   minusLabel?: React.ReactNode;
   label?: React.ReactNode;
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
      <div className="RangeInput">
         {label && <label htmlFor={htmlId}>{label}</label>}
         <div className="-contents">
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
               id={htmlId}
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
      </div>
   );
}
