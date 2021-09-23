import {useMatchMedia} from "./useMatchMedia";

export const useIsInstalled = () =>
    useMatchMedia("(display-mode: standalone)") ||
    (navigator as Navigator & {standalone: boolean}).standalone;
