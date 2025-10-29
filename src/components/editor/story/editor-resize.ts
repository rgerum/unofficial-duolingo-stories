import React from "react";

export default function useResizeEditor(
  editor: HTMLElement | null,
  preview: HTMLElement | null,
  p: HTMLElement | null
) {
  const initDrag = React.useCallback(
    (e: MouseEvent) => {
      if (!editor || !preview) return;
      
      let startX = 0;
      let startWidth = 0;
      let startWidth2: number;

      const doDrag = (e: MouseEvent) => {
        if (!editor || !preview) return;
        editor.style.width = startWidth + e.clientX - startX + "px";
        preview.style.width = startWidth2 - e.clientX + startX + "px";
        window.dispatchEvent(new CustomEvent("resize"));
      };

      const stopDrag = () => {
        document.documentElement.removeEventListener(
          "mousemove",
          doDrag,
          false
        );
        document.documentElement.removeEventListener("mouseup", stopDrag, false);
      };

      startX = e.clientX;
      const editorWidth = document.defaultView?.getComputedStyle(editor).width;
      const previewWidth = document.defaultView?.getComputedStyle(preview).width;
      
      if (!editorWidth || !previewWidth) return;
      
      startWidth = parseInt(editorWidth, 10);
      startWidth2 = parseInt(previewWidth, 10);
      
      document.documentElement.addEventListener("mousemove", doDrag, false);
      document.documentElement.addEventListener("mouseup", stopDrag, false);
    },
    [editor, preview]
  );
  
  React.useEffect(() => {
    if (!p) return;
    
    p.style.cursor = "col-resize";
    p.addEventListener("mousedown", initDrag);

    return () => p.removeEventListener("mousedown", initDrag);
  }, [p, initDrag]);
}
