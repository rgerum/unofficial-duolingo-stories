const EDITOR_MAIN_SCROLL_CONTAINER_SELECTOR =
  '[data-editor-scroll-container="course-main"]';

export function getEditorMainScrollContainer() {
  if (typeof document === "undefined") return null;

  return document.querySelector<HTMLElement>(
    EDITOR_MAIN_SCROLL_CONTAINER_SELECTOR,
  );
}

export function restoreEditorScrollPosition(scrollTop: number, frameCount = 8) {
  const applyScroll = () => {
    const scrollContainer = getEditorMainScrollContainer();
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollTop;
    } else {
      window.scrollTo({ top: scrollTop, behavior: "auto" });
    }
  };

  applyScroll();

  let isCancelled = false;
  let animationFrameId: number | null = null;
  let remainingFrames = frameCount - 1;
  const keepScrollApplied = () => {
    if (isCancelled) return;

    applyScroll();
    remainingFrames -= 1;
    if (remainingFrames > 0) {
      animationFrameId = window.requestAnimationFrame(keepScrollApplied);
    }
  };

  if (remainingFrames > 0) {
    animationFrameId = window.requestAnimationFrame(keepScrollApplied);
  }

  return () => {
    isCancelled = true;
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
    }
  };
}
