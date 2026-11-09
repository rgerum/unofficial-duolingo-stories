import {
  EditorSelection,
  type EditorState,
  RangeSetBuilder,
  StateEffect,
  StateField,
} from "@codemirror/state";
import {
  Decoration,
  EditorView,
  keymap,
  showTooltip,
  type TooltipView,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import {
  findOriginalBlock,
  getBlockHeaderType,
  getBlockPreviewText,
  type OriginalBlockMatch,
} from "./original_story_blocks";

export type OriginalStorySource = {
  id: number;
  name: string;
  courseShort: string;
  /** null while loading; "" when the original has no saved text. */
  text: string | null;
};

type PreviewState = {
  source: OriginalStorySource | null;
  /** Start of the header line whose original is shown, or null when closed. */
  openPos: number | null;
  /**
   * Original block index the editor stepped to with ‹ ›, or null for the
   * automatic match. Absolute, so edits to the translation don't move it.
   */
  pinned: number | null;
};

/** Provides (or clears) the original story the markers point into. */
export const setOriginalStorySource =
  StateEffect.define<OriginalStorySource | null>();
const setOpenPos = StateEffect.define<number | null>();
const setPinned = StateEffect.define<number | null>();

const TOGGLE_SHORTCUT = "Alt-Shift-o";
const MARKER_TITLE =
  "Show this block in the original Spanish story (Alt+Shift+O for the cursor's block)";

const previewField = StateField.define<PreviewState>({
  create: () => ({ source: null, openPos: null, pinned: null }),
  update(value, tr) {
    let { source, openPos, pinned } = value;
    if (openPos !== null && tr.docChanged) {
      openPos = tr.changes.mapPos(openPos, -1);
    }
    for (const effect of tr.effects) {
      if (effect.is(setOriginalStorySource)) source = effect.value;
      if (effect.is(setOpenPos)) {
        openPos = effect.value;
        pinned = null;
      }
      if (effect.is(setPinned)) pinned = effect.value;
    }
    if (!source) openPos = null;
    if (openPos !== null) {
      // Close when the header line was edited away.
      const line = tr.state.doc.lineAt(openPos);
      if (!getBlockHeaderType(line.text)) openPos = null;
      else openPos = line.from;
    }
    if (openPos === null) pinned = null;
    if (
      source === value.source &&
      openPos === value.openPos &&
      pinned === value.pinned
    ) {
      return value;
    }
    return { source, openPos, pinned };
  },
  provide: (field) =>
    showTooltip.compute([field, "doc"], (state) => {
      const { source, openPos } = state.field(field);
      if (!source || openPos === null) return null;
      const block = findOriginalBlock(
        state.doc.toString(),
        null,
        state.doc.lineAt(openPos).number,
      );
      if (!block) return null;
      // Anchored at the translated block's last line; see getCoords.
      const endLine = Math.min(block.translated.endLine, state.doc.lines);
      return {
        pos: state.doc.line(endLine).from,
        above: false,
        arrow: false,
        // Always the same function, so CodeMirror updates the popup in place
        // instead of recreating it, which would drop keyboard focus.
        create: createPreviewView,
      };
    }),
});

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function originalStoryHref(source: OriginalStorySource, line?: number) {
  const base = `/editor/course/${source.courseShort}/story/${source.id}`;
  return line ? `${base}?line=${line}` : base;
}

function headerButton(
  className: string,
  text: string,
  label: string,
  onClick: () => void,
) {
  const element = el("button", className, text);
  element.type = "button";
  element.title = label;
  element.setAttribute("aria-label", label);
  // Keep the editor's focus and selection where they are on mouse clicks.
  element.addEventListener("mousedown", (event) => event.preventDefault());
  element.addEventListener("click", () => {
    // aria-disabled (not disabled) keeps a focused button focused at the ends.
    if (element.getAttribute("aria-disabled") !== "true") onClick();
  });
  return element;
}

function setEnabled(element: HTMLElement, enabled: boolean) {
  element.setAttribute("aria-disabled", String(!enabled));
}

function createPreviewView(view: EditorView): TooltipView {
  let current: OriginalBlockMatch | null = null;

  const dom = el("div", "cm-original-preview");
  dom.setAttribute("role", "dialog");
  dom.setAttribute("aria-label", "Original Spanish block");
  dom.dir = "ltr";

  const close = () => {
    const hadFocus = dom.contains(document.activeElement);
    view.dispatch({ effects: setOpenPos.of(null) });
    if (hadFocus) view.focus();
  };
  dom.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    close();
  });

  const header = el("div", "cm-original-preview-header");
  const title = el("span", "cm-original-preview-title", "Original: ");
  const link = el("a", "cm-original-preview-link");
  link.target = "_blank";
  link.rel = "noopener";
  link.title = "Open the original story in a new tab";
  title.appendChild(link);

  const pin = (index: number | null | undefined) => {
    if (index === undefined) return;
    view.dispatch({ effects: setPinned.of(index) });
  };
  const nav = el("span", "cm-original-preview-nav");
  const previous = headerButton(
    "cm-original-preview-button",
    "‹",
    "Previous block of the original",
    () => pin(current?.previousIndex ?? undefined),
  );
  const counter = headerButton(
    "cm-original-preview-counter",
    "",
    "Position in the original",
    () => pin(null),
  );
  const next = headerButton(
    "cm-original-preview-button",
    "›",
    "Next block of the original",
    () => pin(current?.nextIndex ?? undefined),
  );
  nav.append(previous, counter, next);
  const closeButton = headerButton(
    "cm-original-preview-close",
    "×",
    "Close (Esc)",
    close,
  );
  header.append(title, nav, closeButton);
  const body = el("div", "cm-original-preview-body");
  dom.append(header, body);

  const note = (text: string) =>
    body.replaceChildren(el("div", "cm-original-preview-note", text));

  const render = (state: EditorState) => {
    const { source, openPos, pinned } = state.field(previewField);
    if (!source || openPos === null) return;
    const match = findOriginalBlock(
      state.doc.toString(),
      source.text,
      state.doc.lineAt(openPos).number,
      pinned,
    );
    if (!match) return;
    current = match;

    link.textContent = source.name;
    link.href = originalStoryHref(source, match.original?.startLine);

    nav.hidden = match.originalCount === 0;
    setEnabled(previous, match.previousIndex !== null);
    setEnabled(next, match.nextIndex !== null);
    const shifted = match.originalIndex !== match.autoIndex;
    counter.textContent =
      match.originalIndex === null
        ? "–"
        : `${match.originalIndex + 1}/${match.originalCount}`;
    counter.classList.toggle("cm-original-preview-shifted", shifted);
    setEnabled(counter, shifted);
    const counterLabel = shifted
      ? "Stepped away from the automatic match - click to go back"
      : "Position in the original";
    counter.title = counterLabel;
    counter.setAttribute("aria-label", counterLabel);

    if (source.text === null) {
      note("Loading original story…");
    } else if (source.text === "") {
      note("The original story has no text.");
    } else if (!match.original) {
      note(
        `No matching ${match.translated.type} block found in the original story. Use ‹ › to step through it.`,
      );
    } else {
      const text = el(
        "pre",
        "cm-original-preview-text",
        getBlockPreviewText(match.original),
      );
      // Same font as the editor text (its size differs on mobile).
      const editorFont = getComputedStyle(view.contentDOM);
      text.style.fontFamily = editorFont.fontFamily;
      text.style.fontSize = editorFont.fontSize;
      text.style.lineHeight = editorFont.lineHeight;
      body.replaceChildren(text);
    }
  };
  render(view.state);

  return {
    dom,
    update(update: ViewUpdate) {
      if (
        update.docChanged ||
        update.state.field(previewField) !==
          update.startState.field(previewField)
      ) {
        render(update.state);
      }
    },
    // The anchor rect spans the whole translated block: from its header line
    // to the last visual row of its last line (wrapped on mobile). Below, the
    // popup starts under the block; when CodeMirror flips it above for lack
    // of space, it ends above the header. Either way the block stays visible.
    getCoords(anchor) {
      const start = view.coordsAtPos(anchor, 1);
      const end = view.coordsAtPos(view.state.doc.lineAt(anchor).to, -1);
      if (!start || !end) return start ?? end ?? new DOMRect();
      const { openPos } = view.state.field(previewField);
      const header = openPos === null ? null : view.coordsAtPos(openPos, 1);
      return {
        left: start.left,
        right: start.right,
        top: header ? Math.min(header.top, end.top) : end.top,
        bottom: end.bottom,
      };
    },
  };
}

const LANGUAGES_ICON =
  // lucide "languages" icon
  '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';

/** Toggles the original-block popup of the header line containing `pos`. */
function toggleOriginalPreview(
  view: EditorView,
  pos: number,
  onRequestText: () => void,
) {
  const { source, openPos } = view.state.field(previewField);
  if (!source) return false;
  const { doc } = view.state;
  const line = doc.lineAt(pos);
  if (openPos === line.from) {
    view.dispatch({ effects: setOpenPos.of(null) });
    return true;
  }
  const block = findOriginalBlock(doc.toString(), null, line.number);
  if (!block) return false;
  if (source.text === null) onRequestText();
  // The popup hangs below the block's last line, starting at its left edge,
  // and CodeMirror hides it while that point is scrolled out of view. Scroll
  // the whole last line into view with its start as the end that must stay
  // visible: a wrapped line (mobile) shows down to its last row, while a long
  // unwrapped line (like `$...mp3;...` audio) doesn't scroll sideways.
  const endLine = doc.line(Math.min(block.translated.endLine, doc.lines));
  view.dispatch({
    effects: [
      setOpenPos.of(line.from),
      EditorView.scrollIntoView(
        EditorSelection.range(endLine.to, endLine.from),
        {
          x: "nearest",
          y: "nearest",
          yMargin: 120,
        },
      ),
    ],
  });
  return true;
}

/** Keyboard path: toggles the popup of the block the cursor is in. */
function toggleCursorBlockPreview(view: EditorView, onRequestText: () => void) {
  const { doc } = view.state;
  for (let n = doc.lineAt(view.state.selection.main.head).number; n >= 1; n--) {
    const line = doc.line(n);
    const type = getBlockHeaderType(line.text);
    if (!type) continue;
    if (type === "DATA") return false;
    return toggleOriginalPreview(view, line.from, onRequestText);
  }
  return false;
}

class OriginalMarkerWidget extends WidgetType {
  constructor(
    readonly active: boolean,
    readonly onRequestText: () => void,
  ) {
    super();
  }

  eq(other: OriginalMarkerWidget) {
    return other.active === this.active;
  }

  toDOM(view: EditorView) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = this.active
      ? "cm-original-marker cm-original-marker-active"
      : "cm-original-marker";
    button.title = MARKER_TITLE;
    button.setAttribute("aria-label", MARKER_TITLE);
    button.setAttribute("aria-expanded", String(this.active));
    button.innerHTML = LANGUAGES_ICON;
    // Keep the editor's focus and selection where they are.
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      toggleOriginalPreview(view, view.posAtDOM(button), this.onRequestText);
    });
    return button;
  }
}

function buildMarkers(state: EditorState, onRequestText: () => void) {
  const { source, openPos } = state.field(previewField);
  if (!source) return Decoration.none;
  const builder = new RangeSetBuilder<Decoration>();
  for (let n = 1; n <= state.doc.lines; n++) {
    const line = state.doc.line(n);
    const type = getBlockHeaderType(line.text);
    if (!type || type === "DATA") continue;
    builder.add(
      line.to,
      line.to,
      Decoration.widget({
        widget: new OriginalMarkerWidget(openPos === line.from, onRequestText),
        side: 1,
      }),
    );
  }
  return builder.finish();
}

/**
 * Adds a marker right after every block header ([LINE], [HEADER], ...) of a
 * translated story. Clicking it shows the matching block of the original
 * Spanish story in a popup that stays open while editing, so the original can
 * be compared with the translation. `onRequestText` is called the first time
 * the popup opens, so the original's text is only loaded when needed.
 */
export const originalStoryPreview = (onRequestText: () => void) => [
  previewField,
  EditorView.decorations.compute([previewField, "doc"], (state) =>
    buildMarkers(state, onRequestText),
  ),
  keymap.of([
    {
      key: TOGGLE_SHORTCUT,
      run: (view) => toggleCursorBlockPreview(view, onRequestText),
      preventDefault: true,
    },
    {
      key: "Escape",
      run(view) {
        if (view.state.field(previewField).openPos === null) return false;
        view.dispatch({ effects: setOpenPos.of(null) });
        return true;
      },
    },
  ]),
  EditorView.theme({
    ".cm-original-marker": {
      display: "inline-flex",
      verticalAlign: "middle",
      marginInlineStart: "6px",
      padding: "4px",
      border: "none",
      background: "transparent",
      font: "inherit",
      lineHeight: "0",
      cursor: "pointer",
      color: "var(--text-color-dim, #888)",
      opacity: "0.55",
      borderRadius: "3px",
    },
    // Bigger hit areas on touch screens without changing the text layout.
    "@media (pointer: coarse)": {
      ".cm-original-marker": {
        position: "relative",
      },
      ".cm-original-marker::after": {
        content: '""',
        position: "absolute",
        inset: "-10px",
      },
      ".cm-original-preview-button, .cm-original-preview-close": {
        minWidth: "40px",
        minHeight: "40px",
      },
    },
    ".cm-original-marker:hover, .cm-original-marker-active": {
      opacity: "1",
      color: "#1cb0f6",
    },
    ".cm-tooltip.cm-original-preview, .cm-original-preview": {
      maxWidth: "min(560px, calc(100vw - 32px))",
      border: "1px solid var(--header-border, #ccc)",
      borderRadius: "8px",
      background: "var(--body-background, #fff)",
      color: "var(--text-color, #222)",
      boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: "min(60vh, 480px)",
    },
    ".cm-original-preview-header": {
      display: "flex",
      flexShrink: "0",
      alignItems: "center",
      gap: "8px",
      padding: "4px 4px 4px 10px",
      borderBottom: "1px solid var(--header-border, #ccc)",
      font: "600 12px/1.4 system-ui, sans-serif",
      color: "var(--text-color-dim, #666)",
    },
    ".cm-original-preview-title": {
      flex: "0 1 auto",
      minWidth: "0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    ".cm-original-preview-link": {
      color: "var(--link-blue, #1cb0f6)",
      textDecoration: "none",
    },
    ".cm-original-preview-link:hover": {
      textDecoration: "underline",
    },
    ".cm-original-preview-close": {
      marginInlineStart: "auto",
      border: "none",
      background: "transparent",
      color: "inherit",
      cursor: "pointer",
      fontSize: "16px",
      lineHeight: "1",
      padding: "2px 6px",
      borderRadius: "4px",
    },
    ".cm-original-preview-nav": {
      display: "inline-flex",
      alignItems: "center",
      gap: "2px",
      flexShrink: "0",
    },
    ".cm-original-preview-button": {
      border: "none",
      background: "transparent",
      color: "inherit",
      cursor: "pointer",
      fontSize: "16px",
      lineHeight: "1",
      padding: "2px 7px",
      borderRadius: "4px",
    },
    ".cm-original-preview-button:hover:not([aria-disabled=true])": {
      background: "var(--overview-hr, rgba(0, 0, 0, 0.08))",
    },
    ".cm-original-preview-button[aria-disabled=true]": {
      opacity: "0.35",
      cursor: "default",
    },
    ".cm-original-preview-counter": {
      minWidth: "3.5em",
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      border: "none",
      background: "transparent",
      color: "inherit",
      font: "inherit",
      padding: "2px 4px",
      borderRadius: "4px",
    },
    ".cm-original-preview-counter[aria-disabled=true]": {
      cursor: "default",
    },
    ".cm-original-preview-shifted": {
      cursor: "pointer",
      color: "#e8a33d",
      textDecoration: "underline dotted",
    },
    ".cm-original-preview-close:hover": {
      background: "var(--overview-hr, rgba(0, 0, 0, 0.08))",
    },
    ".cm-original-preview-body": {
      overflow: "auto",
      minHeight: "0",
    },
    ".cm-original-preview-text": {
      margin: "0",
      padding: "8px 10px",
      whiteSpace: "pre",
    },
    ".cm-original-preview-note": {
      padding: "8px 10px",
      font: "13px/1.4 system-ui, sans-serif",
    },
  }),
];
