import {useMatchMedia} from "./useMatchMedia";

export let useIsInstalled = () =>
    useMatchMedia("(display-mode: standalone)") ||
    (navigator as Navigator & {standalone: boolean}).standalone;
