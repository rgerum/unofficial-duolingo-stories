import { cn } from "@/lib/utils";

/**
 * UI SDK parts accept `className` as a string or as a function of the part's
 * state. Prepend our base classes in either case.
 */
export function mergeClassName<State>(
  base: string,
  className: string | ((state: State) => string | undefined) | undefined,
): string | ((state: State) => string) {
  if (typeof className === "function") {
    return (state: State) => cn(base, className(state));
  }
  return cn(base, className);
}

/**
 * UI SDK popups render in place (in the top layer) rather than in a portal on
 * <body>, so they inherit text styles from wherever they are mounted. Reset
 * the inherited properties that surrounding headers and buttons tend to set.
 */
export const popupTextReset =
  "text-left font-normal normal-case tracking-normal whitespace-normal";
