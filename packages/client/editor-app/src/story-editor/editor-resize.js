import React from "react";


export function useResizeEditor(editor, preview, p) {
    const initDrag = React.useCallback((e) => {
        var startX = 0, startWidth = 0, startWidth2;


        function doDrag(e) {
            editor.style.width = (startWidth + e.clientX - startX) + 'px';
            preview.style.width = (startWidth2 - e.clientX + startX) + 'px';
            window.dispatchEvent(new CustomEvent("resize"));
        }

        function stopDrag() {
            document.documentElement.removeEventListener('mousemove', doDrag, false);
            document.documentElement.removeEventListener('mouseup', stopDrag, false);
        }

        startX = e.clientX;
        startWidth = parseInt(document.defaultView.getComputedStyle(editor).width, 10);
        startWidth2 = parseInt(document.defaultView.getComputedStyle(preview).width, 10);
        document.documentElement.addEventListener('mousemove', doDrag, false);
        document.documentElement.addEventListener('mouseup', stopDrag, false);

    }, [editor, preview]);
    React.useEffect(() => {
        if(!p)
            return;
        p.style.cursor = "col-resize"
        p.addEventListener('mousedown', initDrag);

        return () => p.removeEventListener('mousedown', initDrag);
    }, [p]);
}