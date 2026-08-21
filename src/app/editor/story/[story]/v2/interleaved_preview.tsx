import { StateEffect, StateField, type EditorState } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  WidgetType,
  type DecorationSet,
} from "@codemirror/view";
import { createRoot, type Root } from "react-dom/client";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import {
  getStoryEditorPreviewParts,
  StoryEditorPreviewPart,
} from "@/components/StoryEditorPreview";
import type { StoryType } from "@/components/editor/story/syntax_parser_new";
import type {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import {
  getInterleavedPreviewInteractionKey,
  getInterleavedPreviewLineNumber,
  getInterleavedPreviewRenderKey,
  splitInterleavedPreviewPart,
} from "@/lib/editor/interleaved_preview_positions";

type InterleavedPreviewConfig = {
  story: StoryType & { learning_language_rtl?: boolean };
  editorState?: EditorStateType;
  showHints: boolean;
  showAudio: boolean;
  onOpenAudioEditor?: (
    element: StoryElementLine | StoryElementHeader,
  ) => void | Promise<void>;
};

type WidgetRoot = {
  root: Root;
  measureFrame: number | null;
};

const widgetRoots = new WeakMap<HTMLElement, WidgetRoot>();

export const setInterleavedPreview =
  StateEffect.define<InterleavedPreviewConfig | null>();

const interleavedPreviewField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(decorations, transaction) {
    let nextDecorations = decorations.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (effect.is(setInterleavedPreview)) {
        nextDecorations = effect.value
          ? buildInterleavedPreviewDecorations(transaction.state, effect.value)
          : Decoration.none;
      }
    }
    return nextDecorations;
  },
  provide: (field) => EditorView.decorations.from(field),
});

export const interleavedPreviewExtension = [
  interleavedPreviewField,
  EditorView.theme({
    ".cm-interleaved-preview": {
      boxSizing: "border-box",
      width: "100%",
      minWidth: "0",
      maxWidth: "100%",
      overflow: "hidden",
      padding: "10px 12px",
      borderTop: "1px solid var(--header-border)",
      borderBottom: "1px solid var(--header-border)",
      background:
        "color-mix(in srgb, var(--body-background-faint) 72%, var(--body-background))",
      color: "var(--text-color)",
    },
    ".cm-interleaved-preview .part": {
      minWidth: "0",
      maxWidth: "100%",
      overflow: "hidden",
      fontSize: "14px",
      lineHeight: "1.4",
    },
    ".cm-interleaved-preview .part > :first-child": {
      marginTop: "4px",
    },
    ".cm-interleaved-preview .part > :last-child": {
      marginBottom: "4px",
    },
  }),
];

function buildInterleavedPreviewDecorations(
  state: EditorState,
  config: InterleavedPreviewConfig,
) {
  const parts = getStoryEditorPreviewParts(config.story).flatMap(
    splitInterleavedPreviewPart,
  );
  const ranges = parts.flatMap((part) => {
    const lineNumber = getInterleavedPreviewLineNumber(part, state.doc.lines);
    if (lineNumber === null) return [];

    const renderKey = getInterleavedPreviewRenderKey(part, {
      rtl: config.story.learning_language_rtl ?? false,
      showHints: config.showHints,
      showAudio: config.showAudio,
    });
    const interactionKey = getInterleavedPreviewInteractionKey(part);
    const widget = new InterleavedPreviewWidget(
      part,
      config,
      renderKey,
      interactionKey,
    );
    return [
      Decoration.widget({ widget, block: true, side: -1 }).range(
        state.doc.line(lineNumber).from,
      ),
    ];
  });

  return Decoration.set(ranges, true);
}

class InterleavedPreviewWidget extends WidgetType {
  constructor(
    private readonly part: StoryElement[],
    private readonly config: InterleavedPreviewConfig,
    private readonly renderKey: string,
    private readonly interactionKey: string,
  ) {
    super();
  }

  eq(widget: WidgetType) {
    return (
      widget instanceof InterleavedPreviewWidget &&
      widget.renderKey === this.renderKey &&
      widget.interactionKey === this.interactionKey
    );
  }

  toDOM(view: EditorView) {
    const container = document.createElement("div");
    container.className = "cm-interleaved-preview";
    container.contentEditable = "false";
    renderPreviewWidget(container, view, this.part, this.config, true);
    return container;
  }

  updateDOM(container: HTMLElement, view: EditorView, previousWidget: this) {
    renderPreviewWidget(
      container,
      view,
      this.part,
      this.config,
      previousWidget.renderKey !== this.renderKey,
    );
    return true;
  }

  destroy(container: HTMLElement) {
    const widgetRoot = widgetRoots.get(container);
    if (!widgetRoot) return;
    if (widgetRoot.measureFrame !== null) {
      window.cancelAnimationFrame(widgetRoot.measureFrame);
    }
    widgetRoot.root.unmount();
    widgetRoots.delete(container);
  }
}

function renderPreviewWidget(
  container: HTMLElement,
  view: EditorView,
  part: StoryElement[],
  config: InterleavedPreviewConfig,
  measureAfterRender: boolean,
) {
  let widgetRoot = widgetRoots.get(container);
  if (!widgetRoot) {
    widgetRoot = { root: createRoot(container), measureFrame: null };
    widgetRoots.set(container, widgetRoot);
  }

  widgetRoot.root.render(
    <div
      dir={config.story.learning_language_rtl ? "rtl" : "ltr"}
      className="select-none"
    >
      <StoryEditorPreviewPart
        part={part}
        editorState={config.editorState}
        rtl={config.story.learning_language_rtl ?? false}
        showHints={config.showHints}
        showAudio={config.showAudio}
        onOpenAudioEditor={config.onOpenAudioEditor}
        compact
      />
    </div>,
  );

  if (!measureAfterRender) return;

  if (widgetRoot.measureFrame !== null) {
    window.cancelAnimationFrame(widgetRoot.measureFrame);
  }
  widgetRoot.measureFrame = window.requestAnimationFrame(() => {
    widgetRoot!.measureFrame = null;
    if (view.dom.isConnected) view.requestMeasure();
  });
}
