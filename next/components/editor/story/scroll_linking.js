import React from "react";


export default function useScrollLinking(view, preview, svg_parent) {
    let editor= view?.scrollDOM;
    let last_editor_scroll_pos= 0;
    let last_preview_scroll_pos= 0;
    let line_map = [];

    let update_lines = React.useCallback(() => {
        if(!editor)
            return;
        let svg_element = 0;
        let width1 = parseInt(document.defaultView.getComputedStyle(editor).width, 10);
        if(isNaN(width1))
            return
        let width1b = parseInt(document.defaultView.getComputedStyle(editor).width, 10) + 20;
        let width2 = parseInt(document.defaultView.getComputedStyle(editor).width, 10) + 40;
        let width3 = svg_parent.getBoundingClientRect().width
        let height = svg_parent.getBoundingClientRect().height

        let path = "M0,0 ";
        for (let element of document.querySelectorAll("div[data-lineno]")) {
            let new_lineno = parseInt(element.dataset.lineno);
            let new_top = element.getBoundingClientRect().top - svg_parent.getBoundingClientRect().top - 10;// - preview.scrollTop - preview.getBoundingClientRect().top
            let new_linetop = -5 + (4 + new_lineno) * 26.6 - editor.scrollTop - svg_parent.getBoundingClientRect().top - editor.getBoundingClientRect().top

            if (svg_element % 2 === 0)
                path += `L0,${new_linetop} L ${width1},${new_linetop} C${width1b},${new_linetop} ${width1b},${new_top} ${width2},${new_top} L${width3},${new_top}`;
            else
                path += `L${width3},${new_top} L ${width2},${new_top} C${width1b},${new_top} ${width1b},${new_linetop} ${width1},${new_linetop} L0,${new_linetop}`;
            element.getBoundingClientRect().top
            svg_element += 1;
        }
        if (svg_element % 2 === 1)
            path += `L${width3},${height} L ${0},${height}`;

        svg_parent.children[0].setAttribute("d", path);
    }, [editor, preview, svg_parent]);

    let editor_scroll = React.useCallback(() => {

        requestAnimationFrame(() => {
            if (last_editor_scroll_pos === parseInt(editor.scrollTop))
                return
            last_editor_scroll_pos = parseInt(editor.scrollTop);

            let offset_lines = 1;
            let o = editor.getBoundingClientRect().height / 2
            let target_equal_lineno = (editor.scrollTop - 4 + o) / 26.6 + offset_lines;
            let pairss = createScrollLookUp();
            if (pairss === undefined)
                return;
            for (let i = 0; i < pairss.length - 1; i += 1) {
                let [x1, y1] = pairss[i];
                let [x2, y2] = pairss[i + 1];
                if (x1 <= target_equal_lineno && target_equal_lineno < x2) {
                    let f = (target_equal_lineno - x1) / (x2 - x1);
                    let offsetx = y1 + f * (y2 - y1);
                    last_preview_scroll_pos = parseInt(offsetx - o);
                    preview.scrollTo({top: offsetx - o, behavior: "auto"});
                    break
                }
            }

            update_lines();
        })
    }, [editor, preview]);
    React.useEffect(() => {
        if(!editor)
            return;
        editor.addEventListener('scroll', editor_scroll);
        return () => editor.removeEventListener('scroll', editor_scroll);
    }, [editor, preview]);

    let preview_scroll = React.useCallback(() => {
        requestAnimationFrame(() => {
            if (last_preview_scroll_pos === parseInt(preview.scrollTop))
                return
            last_preview_scroll_pos = parseInt(preview.scrollTop);

            let offset_lines = 1;
            let o = preview.getBoundingClientRect().height / 2
            let target_equal_pos = preview.scrollTop + o;
            let pairss = createScrollLookUp();
            for (let i = 0; i < pairss.length - 1; i += 1) {
                let [x1, y1] = pairss[i];
                let [x2, y2] = pairss[i + 1];
                if (y1 <= target_equal_pos && target_equal_pos < y2) {
                    let f = (target_equal_pos - y1) / (y2 - y1);
                    let offsetx_lineno = x1 + f * (x2 - x1);
                    let offsetx = (offsetx_lineno - offset_lines) * 26.6 - o + 4
                    last_editor_scroll_pos = parseInt(offsetx);
                    editor.scrollTo({top: offsetx, behavior: "auto"});
                    break
                }
            }

            update_lines();
        })
    }, [editor, preview]);
    React.useEffect(() => {
        if(!preview)
            return;
        update_lines();
        preview.addEventListener('scroll', preview_scroll);
        return () => preview.removeEventListener('scroll', preview_scroll);
    }, [editor, preview]);



    let createScrollLookUp = React.useCallback(() => {
        if(!preview)
            return;
        line_map = [[0, 0]]
        for (let element of document.querySelectorAll("div[data-lineno]")) {
            let new_lineno = parseInt(element.dataset.lineno);
            let new_top = element.getBoundingClientRect().top + preview.scrollTop - preview.getBoundingClientRect().top - 10;
            line_map.push([new_lineno, new_top])
        }
        update_lines();
        return line_map;
    }, [editor, preview, svg_parent]);

    let windowResize = React.useCallback(() => {
        createScrollLookUp()
    }, [editor, preview, svg_parent]);
    React.useEffect(() => {
        window.addEventListener("resize", windowResize);
        return () => window.removeEventListener('resize', windowResize);
    }, [editor, preview, svg_parent]);
}
