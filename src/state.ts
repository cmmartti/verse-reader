import React from "react";
import createUseStore from "zustand";
import { persist } from "zustand/middleware";

import * as types from "./types";
import { IndexState } from "./components/BookIndex";

type AppState = {
   [key: `book/${types.DocumentId}/loc`]: types.HymnId | null;
   [key: `book/${types.DocumentId}/index`]: IndexState;
   [key: `book/${types.DocumentId}/history`]: Array<{
      id: types.HymnId;
      timestamp: number;
      note: string;
   }>;
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
