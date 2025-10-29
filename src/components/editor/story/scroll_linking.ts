import React from "react";
import { EditorView } from "codemirror";

export default function useScrollLinking(
  view: EditorView,
  preview: HTMLElement | undefined,
  svg_parent: HTMLElement | undefined,
) {
  let editor = view?.scrollDOM;
  let last_editor_scroll_pos = 0;
  let last_preview_scroll_pos = 0;

  let update_lines = React.useCallback(() => {
    if (!editor || !svg_parent) return;
    if (!document.defaultView) return;
    let svg_element = 0;
    let width1 = parseInt(
      document.defaultView.getComputedStyle(editor).width,
      10,
    );
    if (isNaN(width1)) return;
    let width1b =
      parseInt(document.defaultView.getComputedStyle(editor).width, 10) + 20;
    let width2 =
      parseInt(document.defaultView.getComputedStyle(editor).width, 10) + 40;
    let width3 = svg_parent.getBoundingClientRect().width;
    let height = svg_parent.getBoundingClientRect().height;

    let path = "M0,0 ";
    for (let element of document.querySelectorAll<
      HTMLElement & { dataset: { lineno: string } }
    >("div[data-lineno]")) {
      let new_lineno = parseInt(element.dataset.lineno);
      let new_top =
        element.getBoundingClientRect().top -
        svg_parent.getBoundingClientRect().top -
        10; // - preview.scrollTop - preview.getBoundingClientRect().top
      let new_linetop =
        -10 +
        (4 + new_lineno) * 26.6 -
        editor.scrollTop -
        svg_parent.getBoundingClientRect().top -
        editor.getBoundingClientRect().top;

      if (svg_element % 2 === 0)
        path += `L0,${new_linetop} L ${width1},${new_linetop} C${width1b},${new_linetop} ${width1b},${new_top} ${width2},${new_top} L${width3},${new_top}`;
      else
        path += `L${width3},${new_top} L ${width2},${new_top} C${width1b},${new_top} ${width1b},${new_linetop} ${width1},${new_linetop} L0,${new_linetop}`;
      element.getBoundingClientRect().top;
      svg_element += 1;
    }
    if (svg_element % 2 === 1) path += `L${width3},${height} L ${0},${height}`;

    svg_parent.children[0].setAttribute("d", path);
  }, [editor, preview, svg_parent]);

  function map_side(
    scroll_pos: number,
    pairss: [number, number, number][],
    from_i: number,
    to_i: number,
  ) {
    let o = editor.getBoundingClientRect().height / 3;
    scroll_pos = scroll_pos + o;
    if (pairss === undefined) return;
    function round(x: number) {
      return x;
    }
    for (let i = 0; i < pairss.length - 1; i += 1) {
      let x1 = pairss[i][from_i];
      let x2 = pairss[i + 1][from_i];
      let y1 = pairss[i][to_i];
      let y2 = pairss[i + 1][to_i];
      if (x1 <= scroll_pos && scroll_pos < x2) {
        //if (i === 5) {
        let scroll_diff = scroll_pos - x1;
        let difference = x2 - x1 - (y2 - y1);
        if (difference > 0) {
          if (scroll_diff < difference) return round(y1 - o);
          else return round(y1 + scroll_diff - difference - o);
        } else {
          if (scroll_diff < (x2 - x1) / 2) return round(y1 + scroll_diff - o);
          else return round(y1 + scroll_diff - difference - o);
        }
      }
    }
  }

  let editor_scroll = React.useCallback(() => {
    //window.editor = editor;
    //window.preview = preview;
    requestAnimationFrame(() => {
      if (!editor || !preview) return;
      if (Math.round(last_editor_scroll_pos) === Math.round(editor.scrollTop))
        return;
      last_editor_scroll_pos = editor.scrollTop;

      let new_pos = map_side(editor.scrollTop, createScrollLookUp(), 1, 2);
      if (new_pos === undefined) return;
      last_preview_scroll_pos = new_pos;
      preview.scrollTo({ top: last_preview_scroll_pos, behavior: "auto" });
      update_lines();
    });
  }, [editor, preview]);
  React.useEffect(() => {
    if (!editor) return;
    editor.addEventListener("scroll", editor_scroll);
    return () => editor.removeEventListener("scroll", editor_scroll);
  }, [editor, preview]);

  let preview_scroll = React.useCallback(() => {
    requestAnimationFrame(() => {
      if (!editor || !preview) return;
      if (Math.round(last_preview_scroll_pos) === Math.round(preview.scrollTop))
        return;
      last_preview_scroll_pos = Math.round(preview.scrollTop);

      let new_pos = map_side(preview.scrollTop, createScrollLookUp(), 2, 1);
      if (new_pos === undefined) return;
      last_editor_scroll_pos = new_pos;
      editor.scrollTo({ top: last_editor_scroll_pos, behavior: "auto" });
      update_lines();
    });
  }, [editor, preview]);
  React.useEffect(() => {
    if (!preview) return;
    update_lines();
    preview.addEventListener("scroll", preview_scroll);
    return () => preview.removeEventListener("scroll", preview_scroll);
  }, [editor, preview]);

  let createScrollLookUp = React.useCallback(() => {
    const line_map: [number, number, number][] = [[0, 0, 0]];

    if (!preview) return line_map;

    for (let element of document.querySelectorAll<
      HTMLElement & { dataset: { lineno: string } }
    >("div[data-lineno]")) {
      let new_lineno = parseInt(element.dataset.lineno);
      let new_line_top = new_lineno * 26.6 + 2 - 26.6;
      let new_top =
        element.getBoundingClientRect().top +
        preview.scrollTop -
        preview.getBoundingClientRect().top -
        10;
      line_map.push([new_lineno, new_line_top, new_top]);
    }
    update_lines();
    return line_map;
  }, [editor, preview, svg_parent]);

  let windowResize = React.useCallback(() => {
    if (!editor || !preview) return;
    //createScrollLookUp();

    // the same as the scroll editor
    let new_pos = map_side(editor.scrollTop, createScrollLookUp(), 1, 2);
    if (new_pos === undefined) return;
    last_preview_scroll_pos = new_pos;
    preview.scrollTo({ top: last_preview_scroll_pos, behavior: "auto" });
    update_lines();
  }, [editor, preview, svg_parent]);
  React.useEffect(() => {
    window.addEventListener("resize", windowResize);
    return () => window.removeEventListener("resize", windowResize);
  }, [editor, preview, svg_parent]);
}
