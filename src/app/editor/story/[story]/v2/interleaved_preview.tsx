import { StateEffect, StateField, type EditorState } from "@codemirror/state";
import {
  Decoration,
  EditorView,
  WidgetType,
  type DecorationSet,
} from "@codemirror/view";
import { useSyncExternalStore } from "react";
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
  StoryElementMultipleChoice,
} from "@/components/editor/story/syntax_parser_types";
import {
  getInterleavedPreviewInteractionKey,
  getInterleavedPreviewLineNumber,
  getInterleavedPreviewRenderKey,
  splitInterleavedPreviewPart,
} from "@/lib/editor/interleaved_preview_positions";
import { playSoundEffect } from "@/lib/sound-effects";
import {
  createChoiceButtonStates,
  selectChoiceButton,
  type ChoiceButtonState,
} from "@/lib/story/choice_button_state";

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

type InterleavedAnswerControl = {
  controller: InterleavedChoiceController;
  answerIndex: number;
};

class InterleavedChoiceController {
  private states: ChoiceButtonState[];
  private readonly listeners = new Set<() => void>();

  constructor(
    answerCount: number,
    private readonly rightIndex: number,
  ) {
    this.states = createChoiceButtonStates(answerCount);
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getAnswerState = (answerIndex: number) => this.states[answerIndex];

  select = (answerIndex: number) => {
    const nextStates = selectChoiceButton(
      this.states,
      this.rightIndex,
      answerIndex,
    );
    if (nextStates === this.states) return;

    this.states = nextStates;
    if (answerIndex !== this.rightIndex) playSoundEffect("wrong");
    for (const listener of this.listeners) listener();
  };
}

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
  const settings = {
    rtl: config.story.learning_language_rtl ?? false,
    showHints: config.showHints,
    showAudio: config.showAudio,
  };
  const parts = getStoryEditorPreviewParts(config.story).flatMap(
    (sourcePart) => {
      const continuation = sourcePart.find(
        (element): element is StoryElementMultipleChoice =>
          element.type === "MULTIPLE_CHOICE" &&
          element.trackingProperties.challenge_type === "continuation",
      );
      const splitParts = splitInterleavedPreviewPart(sourcePart);
      const choiceController = continuation
        ? new InterleavedChoiceController(
            continuation.answers.length,
            continuation.correctAnswerIndex,
          )
        : undefined;
      const choiceGroupRenderKey = continuation
        ? getInterleavedPreviewRenderKey([continuation], settings)
        : undefined;
      const choiceGroupInteractionKey = continuation
        ? getInterleavedPreviewInteractionKey([continuation])
        : undefined;

      return splitParts.map((part) => {
        const answer = part.find(
          (element) =>
            element.type === "MULTIPLE_CHOICE" &&
            element.trackingProperties.challenge_type === "continuation" &&
            element.answers.length === 1 &&
            element.editor.answer_positions?.length === 1,
        );
        const answerIndex =
          answer?.type === "MULTIPLE_CHOICE"
            ? answer.editor.answer_positions?.[0]?.answer_index
            : undefined;

        return {
          part,
          answerControl:
            choiceController && answerIndex !== undefined
              ? { controller: choiceController, answerIndex }
              : undefined,
          choiceGroupRenderKey,
          choiceGroupInteractionKey,
        };
      });
    },
  );
  const ranges = parts.flatMap(
    ({
      part,
      answerControl,
      choiceGroupRenderKey,
      choiceGroupInteractionKey,
    }) => {
      const lineNumber = getInterleavedPreviewLineNumber(part, state.doc.lines);
      if (lineNumber === null) return [];

      const renderKey = JSON.stringify({
        part: getInterleavedPreviewRenderKey(part, settings),
        choiceGroup: choiceGroupRenderKey,
      });
      const interactionKey = JSON.stringify({
        part: getInterleavedPreviewInteractionKey(part),
        choiceGroup: choiceGroupInteractionKey,
      });
      const widget = new InterleavedPreviewWidget(
        part,
        config,
        renderKey,
        interactionKey,
        answerControl,
      );
      return [
        Decoration.widget({ widget, block: true, side: -1 }).range(
          state.doc.line(lineNumber).from,
        ),
      ];
    },
  );

  return Decoration.set(ranges, true);
}

class InterleavedPreviewWidget extends WidgetType {
  constructor(
    private readonly part: StoryElement[],
    private readonly config: InterleavedPreviewConfig,
    private readonly renderKey: string,
    private readonly interactionKey: string,
    private readonly answerControl?: InterleavedAnswerControl,
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
    renderPreviewWidget(
      container,
      view,
      this.part,
      this.config,
      this.answerControl,
      true,
    );
    return container;
  }

  updateDOM(container: HTMLElement, view: EditorView, previousWidget: this) {
    renderPreviewWidget(
      container,
      view,
      this.part,
      this.config,
      this.answerControl,
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
  answerControl: InterleavedAnswerControl | undefined,
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
      <InterleavedPreviewPart
        part={part}
        config={config}
        answerControl={answerControl}
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

function InterleavedPreviewPart({
  part,
  config,
  answerControl,
}: {
  part: StoryElement[];
  config: InterleavedPreviewConfig;
  answerControl: InterleavedAnswerControl | undefined;
}) {
  if (answerControl) {
    return (
      <ControlledInterleavedPreviewPart
        part={part}
        config={config}
        answerControl={answerControl}
      />
    );
  }

  return <PreviewPart part={part} config={config} />;
}

function ControlledInterleavedPreviewPart({
  part,
  config,
  answerControl,
}: {
  part: StoryElement[];
  config: InterleavedPreviewConfig;
  answerControl: InterleavedAnswerControl;
}) {
  const state = useSyncExternalStore(
    answerControl.controller.subscribe,
    () => answerControl.controller.getAnswerState(answerControl.answerIndex),
    () => undefined,
  );

  return (
    <PreviewPart
      part={part}
      config={config}
      singleAnswerControl={{
        state,
        select: () =>
          answerControl.controller.select(answerControl.answerIndex),
      }}
    />
  );
}

function PreviewPart({
  part,
  config,
  singleAnswerControl,
}: {
  part: StoryElement[];
  config: InterleavedPreviewConfig;
  singleAnswerControl?: Parameters<
    typeof StoryEditorPreviewPart
  >[0]["singleAnswerControl"];
}) {
  return (
    <StoryEditorPreviewPart
      part={part}
      editorState={config.editorState}
      rtl={config.story.learning_language_rtl ?? false}
      showHints={config.showHints}
      showAudio={config.showAudio}
      onOpenAudioEditor={config.onOpenAudioEditor}
      singleAnswerControl={singleAnswerControl}
      compact
    />
  );
}
