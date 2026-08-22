export type ChoiceButtonState = "right" | "false" | "done" | undefined;

export function createChoiceButtonStates(count: number): ChoiceButtonState[] {
  return Array.from({ length: count });
}

export function selectChoiceButton(
  states: ChoiceButtonState[],
  rightIndex: number,
  selectedIndex: number,
): ChoiceButtonState[] {
  if (states[selectedIndex] !== undefined) return states;

  if (selectedIndex === rightIndex) {
    return states.map((state, index) =>
      index === selectedIndex ? "right" : state === "false" ? "false" : "done",
    );
  }

  return states.map((state, index) =>
    index === selectedIndex ? "false" : state,
  );
}
