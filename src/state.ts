import React from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import * as types from "./types";

type AppState = {
   [key: `book/${string}/loc`]: types.HymnId | null;
   [key: `book/${string}/search`]: string;
   [key: `book/${string}/index`]: types.IndexType | null;
   [key: `book/${string}/index/${string}/sort`]: string;
   [key: `book/${string}/index/${string}/expandedGroups`]: string[] | "all";
};

const useStore = create<AppState>()(persist(() => ({}), { name: "AppState" }));

export function setAppState<K extends keyof AppState>(key: K, value: AppState[K]) {
   useStore.setState(state => ({ ...state, [key]: value }));
}

export function getAppState<K extends keyof AppState>(key: K) {
   return useStore.getState()[key];
}

export function useAppState<K extends keyof AppState>(
   key: K,
   initialState?: AppState[K] | ((prevState: AppState[K]) => AppState[K])
): [AppState[K], React.Dispatch<React.SetStateAction<AppState[K]>>] {
   let state = useStore(state => state[key]);

   let keyRef = React.useRef(key);
   React.useEffect(() => {
      keyRef.current = key;
   }, [key]);

   let setState = React.useCallback(
      (newValue: React.SetStateAction<AppState[K]>) =>
         useStore.setState(state => ({ ...state, [keyRef.current]: newValue })),
      []
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
