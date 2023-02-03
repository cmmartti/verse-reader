import React from "react";

import fonts from "./fonts";
import { useMatchMedia } from "./util/useMatchMedia";

const DEFAULT_OPTIONS = {
   condenseRepeatedLines: true,
   repeatRefrain: true,
   repeatChorus: false,
   colorScheme: "light",
   fontSize: 20,
   fontFamily: "charter",
   pageMargins: 25,
   lineHeight: 1.4,
   paragraphSpacing: 0.5,
   hyphenation: true,
   separatorColor: "gray" as "red" | "gray" | "off",
   currentTab: "font" as "font" | "format" | "layout",
   showSearchResultDetails: false,
};

export type Options = typeof DEFAULT_OPTIONS;

type ContextValue = [Options, React.Dispatch<React.SetStateAction<Options>>];
const OptionsContext = React.createContext<ContextValue | undefined>(undefined);

let setVar = (name: string, value: string) =>
   document.documentElement.style.setProperty(name, value);

export function OptionsProvider({ children }: { children: React.ReactNode }) {
   let [options, setOptions] = React.useState(() => loadOptions());

   React.useEffect(() => {
      saveOptions(options);
   }, [options]);

   let systemColorScheme = useMatchMedia("(prefers-color-scheme: dark)")
      ? ("dark" as const)
      : ("light" as const);

   React.useLayoutEffect(() => {
      document.documentElement.setAttribute(
         "data-color-scheme",
         options.colorScheme === "system" ? systemColorScheme : options.colorScheme
      );
   }, [options.colorScheme, systemColorScheme]);

   React.useLayoutEffect(() => {
      setVar("--OPTION-fontSize", options.fontSize + "px");
   }, [options.fontSize]);

   React.useLayoutEffect(() => {
      setVar(
         "--OPTION-fontFamily",
         (fonts.find(font => font.id === options.fontFamily) ?? fonts[0]!).value
      );
   }, [options.fontFamily]);

   React.useLayoutEffect(() => {
      setVar("--OPTION-pageMargins", options.pageMargins + "px");
   }, [options.pageMargins]);

   React.useLayoutEffect(() => {
      setVar("--OPTION-lineHeight", options.lineHeight.toString());
   }, [options.lineHeight]);

   React.useLayoutEffect(() => {
      setVar("--OPTION-paragraphSpacing", options.paragraphSpacing + "em");
   }, [options.paragraphSpacing]);

   React.useLayoutEffect(() => {
      setVar("--OPTION-hyphenation", options.hyphenation ? "auto" : "none");
   }, [options.hyphenation]);

   React.useLayoutEffect(() => {
      setVar(
         "--OPTION-separatorColor",
         options.separatorColor === "red"
            ? "red"
            : options.separatorColor === "gray"
            ? "var(--color2)"
            : "transparent"
      );
   }, [options.separatorColor]);

   return (
      <OptionsContext.Provider value={[options, setOptions]}>
         {children}
      </OptionsContext.Provider>
   );
}

export function useOption<K extends keyof Options>(
   key: K
): [Options[K], (value?: Options[K]) => void] {
   let context = React.useContext(OptionsContext);
   if (context === undefined) {
      throw new Error("useOption must be within OptionsProvider");
   }

   let [options, setOptions] = context;
   return [
      options[key],
      React.useCallback(
         value =>
            setOptions(prevOptions => ({
               ...prevOptions,
               [key]: value !== undefined ? value : DEFAULT_OPTIONS[key],
            })),
         [key, setOptions]
      ),
   ];
}

function saveOptions(options: Options): void {
   localStorage.setItem("options", JSON.stringify(options));
}

function loadOptions(): Options {
   let optionsJSON = localStorage.getItem("options");
   if (!optionsJSON) {
      console.error("Error loading options from LocalStorage.");
      return DEFAULT_OPTIONS;
   }
   return {
      ...DEFAULT_OPTIONS,
      ...JSON.parse(optionsJSON),
   };
}
