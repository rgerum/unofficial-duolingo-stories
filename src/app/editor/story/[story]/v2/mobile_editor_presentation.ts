import { EditorView } from "@codemirror/view";

export const mobileEditorTheme = {
  ".cm-scroller": {
    fontSize: "16px",
    overflowX: "hidden",
  },
  ".cm-content": {
    minWidth: "0",
    paddingBottom: "50vh",
  },
  ".cm-line": {
    padding: "0 2px 0 4px",
  },
  ".cm-lineNumbers": {
    fontSize: "12px",
    lineHeight: "22.4px",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "0",
    padding: "0 3px 0 2px",
  },
  ".cm-foldGutter": {
    display: "none !important",
  },
};

export const mobileEditorPresentation = [
  EditorView.lineWrapping,
  EditorView.theme(mobileEditorTheme),
];
