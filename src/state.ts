import React from "react";
import createUseStore from "zustand";
import { persist } from "zustand/middleware";

import * as types from "./types";

export type IndexState = {
   index: types.IndexType;
   sort: { [context: string]: string | undefined };
   search: string;
   expandedCategories: { [context: string]: string[] | "all" };
};

type AppState = {
   [key: `book/${string}/loc`]: types.HymnId | null;
   [key: `book/${string}/index`]: IndexState;
};

const defaultState: AppState = {};

export const useStore = createUseStore<AppState>()(
   persist(() => defaultState, { name: "AppState" })
);

export const store = useStore;

export function useAppState<K extends keyof AppState>(
   key: K,
   initialState?: AppState[K] | ((prevState: AppState[K]) => AppState[K])
): [AppState[K], React.Dispatch<React.SetStateAction<AppState[K]>>] {
   let state = useStore(state => state[key]);

   let setState = React.useCallback(
      (newValue: React.SetStateAction<AppState[K]>) =>
         useStore.setState(state => ({ ...state, [key]: newValue })),
      [key]
   );

   let stateRef = React.useRef(state);
   React.useEffect(() => {
      stateRef.current = state;
   });

   initialState = React.useMemo(() => {
      return typeof initialState === "function"
         ? initialState(stateRef.current)
         : initialState;
   }, [initialState]);

   if (state === undefined && initialState !== undefined) {
      return [initialState, setState];
   }
   return [state, setState];
}
