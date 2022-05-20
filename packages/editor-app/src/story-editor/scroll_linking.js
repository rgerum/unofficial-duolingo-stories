/* scroll linking */
export function addScrollLinking(view) {
    let editor = view.scrollDOM//document.getElementById("editor");
    console.log("document.getElementById(\"editor\").firstChild;", document.getElementById("editor").firstChild)

//let editor;// = document.getElementById("editor");
    let preview = document.getElementById("preview");
    let svg_parent = document.getElementById("margin");

    window.scroll_lookup = [];

    function update_lines() {
        let svg_element = 0;
        let width1 = parseInt(document.defaultView.getComputedStyle(editor).width, 10);//svg_parent.getBoundingClientRect().width * 0.48
        let width1b = parseInt(document.defaultView.getComputedStyle(editor).width, 10) + 20;//svg_parent.getBoundingClientRect().width * 0.50
        let width2 = parseInt(document.defaultView.getComputedStyle(editor).width, 10) + 40;//svg_parent.getBoundingClientRect().width * 0.52
        let width3 = svg_parent.getBoundingClientRect().width
        let height = svg_parent.getBoundingClientRect().height

        //let pairs = []
        //let pairs2 = []
        let path = "M0,0 ";
        for (let element of document.querySelectorAll("div[lineno]")) {
            let new_lineno = parseInt(element.attributes.lineno.value);
            let new_top = element.getBoundingClientRect().top - svg_parent.getBoundingClientRect().top - 10;// - preview.scrollTop - preview.getBoundingClientRect().top
            let new_linetop = (4 + new_lineno) * 26.6 - editor.scrollTop - svg_parent.getBoundingClientRect().top - editor.getBoundingClientRect().top
            if (svg_element % 2 === 0)
                path += `L0,${new_linetop} L ${width1},${new_linetop} C${width1b},${new_linetop} ${width1b},${new_top} ${width2},${new_top} L${width3},${new_top}`;
            else
                path += `L${width3},${new_top} L ${width2},${new_top} C${width1b},${new_top} ${width1b},${new_linetop} ${width1},${new_linetop} L0,${new_linetop}`;
            element.getBoundingClientRect().top
            svg_element += 1;
            //pairs.push([new_linetop, new_top])
            //pairs2.push([new_lineno, new_top])
        }
        if (svg_element % 2 === 1)
            path += `L${width3},${height} L ${0},${height}`;
        svg_parent.children[0].setAttribute("d", path)
    }

    let last_editor_scroll_pos = 0;
    editor.addEventListener('scroll', function () {
        requestAnimationFrame(() => {
            if (last_editor_scroll_pos === parseInt(editor.scrollTop))
                return
            last_editor_scroll_pos = parseInt(editor.scrollTop);

            let offset_lines = 1;
            let o = editor.getBoundingClientRect().height / 2
            let target_equal_lineno = (editor.scrollTop - 4 + o) / 26.6 + offset_lines;
            let pairss = window.line_map;
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

    });
    let last_preview_scroll_pos = 0;
    preview.addEventListener('scroll', function () {
        requestAnimationFrame(() => {
            if (last_preview_scroll_pos === parseInt(preview.scrollTop))
                return
            last_preview_scroll_pos = parseInt(preview.scrollTop);

            let offset_lines = 1;
            let o = preview.getBoundingClientRect().height / 2
            //let target_equal_lineno = (editor.scrollTop-4 + o)/26.6+offset_lines;
            let target_equal_pos = preview.scrollTop + o;
            let pairss = window.line_map
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

    });
    let createScrollLookUp = function () {
        let line_map = []
        let preview = document.getElementById("preview");
        window.line_map = [[0, 0]]
        for (let element of document.querySelectorAll("div[lineno]")) {
            let new_lineno = parseInt(element.attributes.lineno.value);
            let new_top = element.getBoundingClientRect().top + preview.scrollTop - preview.getBoundingClientRect().top - 10;
            window.line_map.push([new_lineno, new_top])
        }
        update_lines();
        return line_map;
    }
    window.addEventListener("resize", function () {
        createScrollLookUp();
    });
    /* end scroll linking */
}