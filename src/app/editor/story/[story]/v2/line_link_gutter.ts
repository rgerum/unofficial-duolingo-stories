import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { copyToClipboard } from "@/lib/copy_to_clipboard";

const COPY_SHORTCUT = "Mod-Shift-y";
const COPY_HINT =
  "Click to copy a link to this line (or press Ctrl/Cmd+Shift+Y to copy a link to the cursor line)";
const FEEDBACK_DURATION_MS = 1500;

/**
 * Builds a shareable link to a single story line. Only the `line` parameter is
 * kept: everything else in the current URL (e.g. `returnTo`) is specific to
 * the person sharing the link.
 */
export function buildStoryLineLink(currentHref: string, line: number) {
  const url = new URL(currentHref);
  url.search = "";
  url.hash = "";
  url.searchParams.set("line", String(line));
  return url.toString();
}

type FeedbackPosition = { x: number; y: number };

function showCopyFeedback(position: FeedbackPosition, message: string) {
  const badge = document.createElement("div");
  badge.textContent = message;
  badge.setAttribute("role", "status");
  Object.assign(badge.style, {
    position: "fixed",
    left: `${position.x + 12}px`,
    top: `${position.y - 12}px`,
    zIndex: "1000",
    padding: "4px 8px",
    borderRadius: "6px",
    background: "rgba(17, 24, 39, 0.92)",
    color: "#fff",
    font: "600 12px/1.2 system-ui, sans-serif",
    pointerEvents: "none",
    whiteSpace: "nowrap",
  });
  document.body.appendChild(badge);
  window.setTimeout(() => badge.remove(), FEEDBACK_DURATION_MS);
}

function copyLineLink(lineNumber: number, position: FeedbackPosition) {
  const link = buildStoryLineLink(window.location.href, lineNumber);
  copyToClipboard(link).then(
    () => showCopyFeedback(position, `Link to line ${lineNumber} copied`),
    () => showCopyFeedback(position, "Could not copy link"),
  );
}

/** Keyboard equivalent of clicking a line number: copies the cursor's line. */
function copyCursorLineLink(view: EditorView) {
  const head = view.state.selection.main.head;
  const lineNumber = view.state.doc.lineAt(head).number;
  const coords = view.coordsAtPos(head);
  const rect = view.contentDOM.getBoundingClientRect();
  copyLineLink(lineNumber, {
    x: coords?.left ?? rect.left,
    y: coords?.top ?? rect.top,
  });
  return true;
}

/**
 * Makes the line-number gutter clickable: clicking a number copies a link that
 * opens the story editor focused on that line (`?line=N`). Merges with the
 * line-number gutter from `basicSetup`, so no second gutter is added. Since
 * gutter numbers cannot be focused, Ctrl/Cmd+Shift+Y does the same for the
 * line the cursor is on.
 */
export const lineLinkGutter = [
  lineNumbers({
    domEventHandlers: {
      mouseover(_view, _line, event) {
        const target = event.target as HTMLElement | null;
        const element = target?.closest(".cm-gutterElement");
        if (element instanceof HTMLElement && !element.title) {
          element.title = COPY_HINT;
        }
        return false;
      },
      click(view, line, event) {
        const lineNumber = view.state.doc.lineAt(line.from).number;
        const { clientX, clientY } = event as MouseEvent;
        copyLineLink(lineNumber, { x: clientX, y: clientY });
        return true;
      },
    },
  }),
  keymap.of([
    { key: COPY_SHORTCUT, run: copyCursorLineLink, preventDefault: true },
  ]),
  EditorView.theme({
    ".cm-lineNumbers .cm-gutterElement": {
      cursor: "pointer",
    },
    ".cm-lineNumbers .cm-gutterElement:hover": {
      textDecoration: "underline",
      color: "#1cb0f6",
    },
  }),
];
