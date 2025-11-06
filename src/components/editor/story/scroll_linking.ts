import React from "react";
import { EditorView } from "codemirror";

function update_lines(editor: HTMLElement, svg_parent: SVGElement | null) {
  const line_element = editor.querySelector(".cm-line");
  if (!editor || !svg_parent || !line_element) return;
  if (!document.defaultView) return;
  const line_height = line_element.getBoundingClientRect().height;

  let svg_element = 0;
  const width1 = parseInt(document.defaultView.getComputedStyle(editor).width);
  if (isNaN(width1)) return;
  const width1b =
    parseInt(document.defaultView.getComputedStyle(editor).width) + 20;
  const width2 =
    parseInt(document.defaultView.getComputedStyle(editor).width) + 40;
  const width3 = svg_parent.getBoundingClientRect().width;
  const height = svg_parent.getBoundingClientRect().height;

  let path = "M0,0 ";
  for (const element of document.querySelectorAll<
    HTMLElement & { dataset: { lineno: string } }
  >("div[data-lineno]")) {
    const new_lineno = parseInt(element.dataset.lineno);
    const new_top =
      element.getBoundingClientRect().top -
      svg_parent.getBoundingClientRect().top -
      10; // - preview.scrollTop - preview.getBoundingClientRect().top
    const new_linetop =
      -10 +
      (4 + new_lineno) * line_height -
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
}

function createScrollLookUp(
  editor: HTMLElement,
  preview: HTMLElement | undefined,
) {
  const line_element = editor.querySelector(".cm-line");
  const line_map: [number, number, number][] = [[0, 0, 0]];
  if (!preview || !line_element) return line_map;

  const line_height = line_element.getBoundingClientRect().height;
  for (let element of document.querySelectorAll<
    HTMLElement & { dataset: { lineno: string } }
  >("div[data-lineno]")) {
    let new_lineno = parseInt(element.dataset.lineno);
    let new_line_top = new_lineno * line_height + 2 - line_height;
    let new_top =
      element.getBoundingClientRect().top +
      preview.scrollTop -
      preview.getBoundingClientRect().top -
      10;
    line_map.push([new_lineno, new_line_top, new_top]);
  }

  return line_map;
}

function map_side(
  scroll_pos: number,
  pairss: [number, number, number][],
  from_i: number,
  to_i: number,
  o: number,
) {
  scroll_pos = scroll_pos + o;
  if (pairss === undefined) return;
  function round(x: number) {
    return x;
  }
  for (let i = 0; i < pairss.length - 1; i += 1) {
    const x1 = pairss[i][from_i];
    const x2 = pairss[i + 1][from_i];
    const y1 = pairss[i][to_i];
    const y2 = pairss[i + 1][to_i];
    if (x1 <= scroll_pos && scroll_pos < x2) {
      //if (i === 5) {
      const scroll_diff = scroll_pos - x1;
      const difference = x2 - x1 - (y2 - y1);
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

function useAutoResetRef<T>() {
  const last_scrolled_element = React.useRef<T | null>(null);
  const last_scrolled_element_timeout = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  function setLastScrolledElement(element: T) {
    last_scrolled_element.current = element;
    if (last_scrolled_element_timeout.current !== null) {
      clearTimeout(last_scrolled_element_timeout.current);
    }
    last_scrolled_element_timeout.current = setTimeout(() => {
      last_scrolled_element.current = null;
      last_scrolled_element_timeout.current = null;
    }, 500);
  }
  return [last_scrolled_element, setLastScrolledElement] as const;
}

export default function useScrollLinking(
  view: EditorView | undefined,
  preview: HTMLElement | null,
  svg_parent: SVGElement | null,
) {
  const editor = view?.scrollDOM;
  const [last_scrolled_element, setLastScrolledElement] = useAutoResetRef<
    "editor" | "preview"
  >();

  React.useEffect(() => {
    if (!editor) return;

    function editor_scroll() {
      requestAnimationFrame(() => {
        if (!editor || !preview) return;
        if (last_scrolled_element.current === "preview") return;
        setLastScrolledElement("editor");

        const new_pos = map_side(
          editor.scrollTop,
          createScrollLookUp(editor, preview),
          1,
          2,
          editor.getBoundingClientRect().height / 3,
        );
        if (new_pos === undefined) return;
        preview.scrollTo({
          top: new_pos,
          behavior: "auto",
        });
        update_lines(editor, svg_parent);
      });
    }
    editor.addEventListener("scroll", editor_scroll);
    return () => editor.removeEventListener("scroll", editor_scroll);
  }, [editor, preview, svg_parent]);

  React.useEffect(() => {
    if (!preview || !editor) return;
    update_lines(editor, svg_parent);

    function preview_scroll() {
      requestAnimationFrame(() => {
        if (!editor || !preview) return;
        if (last_scrolled_element.current === "editor") return;
        setLastScrolledElement("preview");

        const new_pos = map_side(
          preview.scrollTop,
          createScrollLookUp(editor, preview),
          2,
          1,
          editor.getBoundingClientRect().height / 3,
        );
        if (new_pos === undefined) return;
        editor.scrollTo({
          top: new_pos,
          behavior: "auto",
        });
        update_lines(editor, svg_parent);
      });
    }

    preview.addEventListener("scroll", preview_scroll);
    return () => preview.removeEventListener("scroll", preview_scroll);
  }, [editor, preview, svg_parent]);

  React.useEffect(() => {
    function windowResize() {
      if (!editor || !preview) return;
      // the same as the scroll editor
      const new_pos = map_side(
        editor.scrollTop,
        createScrollLookUp(editor, preview),
        1,
        2,
        editor.getBoundingClientRect().height / 3,
      );
      if (new_pos === undefined) return;
      preview.scrollTo({
        top: new_pos,
        behavior: "auto",
      });
      update_lines(editor, svg_parent);
    }
    window.addEventListener("resize", windowResize);
    return () => window.removeEventListener("resize", windowResize);
  }, [editor, preview, svg_parent]);
}
