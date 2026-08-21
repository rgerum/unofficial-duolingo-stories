const EDITOR_MAIN_SCROLL_CONTAINER_SELECTOR =
  '[data-editor-scroll-container="course-main"]';

export function getEditorMainScrollContainer() {
  if (typeof document === "undefined") return null;

  return document.querySelector<HTMLElement>(
    EDITOR_MAIN_SCROLL_CONTAINER_SELECTOR,
  );
}
