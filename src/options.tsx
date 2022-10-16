import React from "react";

import { fonts } from "./fonts";
import { useMatchMedia } from "./util/useMatchMedia";

const DEFAULT_OPTIONS = {
   expandRepeatedLines: false,
   repeatRefrain: true,
   repeatChorus: false,
   colorScheme: "light",
   fontSize: 1.2,
   fontFamily: "charter",
};

type Options = typeof DEFAULT_OPTIONS;

type ContextValue = [Options, React.Dispatch<React.SetStateAction<Options>>];
const OptionsContext = React.createContext<ContextValue | undefined>(undefined);

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
      document.documentElement.style.setProperty(
         "--ui-scale-factor",
         options.fontSize.toString()
      );
   }, [options.fontSize]);

   React.useLayoutEffect(() => {
      document.documentElement.style.setProperty(
         "--page-font-family",
         (fonts.find(font => font.id === options.fontFamily) ?? fonts[0]!).value
      );
   }, [options.fontFamily]);

   return (
      <OptionsContext.Provider value={[options, setOptions]}>
         {children}
      </OptionsContext.Provider>
   );
}

export function useOption<K extends keyof Options>(
   key: K
): [Options[K], (value: Options[K]) => void] {
   let context = React.useContext(OptionsContext);
   if (context === undefined) {
      throw new Error("useOption must be within OptionsProvider");
   }

   let [options, setOptions] = context;
   return [
      options[key],
      React.useCallback(
         value => setOptions(prevOptions => ({ ...prevOptions, [key]: value })),
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
