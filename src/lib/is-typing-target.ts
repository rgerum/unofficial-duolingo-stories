export function isTypingTarget(
  target: EventTarget | null,
  options?: { includeButtons?: boolean },
) {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    (options?.includeButtons === true && tagName === "BUTTON")
  );
}
