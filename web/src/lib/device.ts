// True only on devices with a precise pointer (desktop mouse/trackpad). Used to
// suppress autoFocus on touch devices, where focusing an input on mount pops the
// on-screen keyboard unexpectedly — e.g. the dashboard intention field during the
// guided tour.
export function canAutoFocus(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(pointer: fine)").matches;
}
