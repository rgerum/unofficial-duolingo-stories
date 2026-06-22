import React, { CSSProperties } from "react";
import { ContentWithHints } from "@/components/editor/story/syntax_parser_types";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import { cn } from "@/lib/utils";

type Range = { start: number; end: number };
type HiddenState = boolean | undefined | "editor";

const underlineBaseStyle: CSSProperties = {
  backgroundPosition: "0 100%",
  backgroundRepeat: "repeat-x",
  backgroundSize: "5px 2px",
  lineHeight: "2em",
  paddingBottom: "5px",
};
const revealedUnderlineStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--underline-dashed) 60%, rgba(255, 255, 255, 0) 0%)",
};
const hiddenUnderlineStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--underline-solid) 60%, var(--underline-solid) 60%)",
};
const tooltipContainerStyle = {
  ...underlineBaseStyle,
  "--story-hint-underline": "var(--underline-dashed)",
  paddingBottom: "5px",
  backgroundImage:
    "linear-gradient(to right, var(--story-hint-underline) 60%, rgba(255, 255, 255, 0) 0%)",
  outlineColor: "var(--tooltip-border)",
} as CSSProperties;
const tooltipContentStyle: CSSProperties = {
  borderColor: "var(--tooltip-border)",
  backgroundColor: "var(--tooltip-backgroud)",
  color: "var(--tooltip-color)",
};
const tooltipContentWithPronunciationStyle: CSSProperties = {
  ...tooltipContentStyle,
  bottom: "calc(115% + 4px)",
};
const tooltipArrowStyle: CSSProperties = {
  borderColor:
    "transparent transparent var(--tooltip-border) var(--tooltip-border)",
  backgroundColor: "var(--tooltip-backgroud)",
};

function splitTextTokens(text: string) {
  if (!text) return [];
  return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}]+)/);
}

function Tooltip({
  className,
  children,
  interactive = false,
  ...delegated
}: {
  className?: string;
  children: React.ReactNode;
  interactive?: boolean;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const ref = React.useRef<HTMLSpanElement>(null);

  function setUnderlineHighlighted(isHighlighted: boolean) {
    ref.current?.style.setProperty(
      "--story-hint-underline",
      isHighlighted
        ? "var(--underline-dashed-highlight)"
        : "var(--underline-dashed)",
    );
  }

  function positionTooltip() {
    if (!ref.current) return;
    const tooltipElement = ref.current.querySelector("[data-hint-tooltip]");
    if (!(tooltipElement instanceof HTMLElement)) return;

    tooltipElement.style.left = "50%";

    // Calculate the position of the tooltip
    const tooltipRect = tooltipElement.getBoundingClientRect();

    // Check if the tooltip would be cut off on the right
    if (tooltipRect.right > window.innerWidth) {
      tooltipElement.style.left = `calc(50% + ${
        window.innerWidth - tooltipRect.right
      }px)`;
    }
    // check if the tooltip would be cuf off on the left
    else if (tooltipRect.left < 0) {
      tooltipElement.style.left = `calc(50% + ${-tooltipRect.left}px)`;
    }
  }
  return (
    <span
      {...delegated}
      onBlur={() => setUnderlineHighlighted(false)}
      onFocus={() => {
        setUnderlineHighlighted(true);
        positionTooltip();
      }}
      onMouseEnter={() => {
        setUnderlineHighlighted(true);
        positionTooltip();
      }}
      onMouseLeave={() => setUnderlineHighlighted(false)}
      ref={ref}
      className={className}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </span>
  );
}

function StoryLineHints({
  content,
  showHints = true,
  showTranslationsInline,
  audioRange,
  hideRangesForChallenge,
  unhide,
  editorState,
}: {
  content: ContentWithHints;
  showHints?: boolean;
  showTranslationsInline?: boolean;
  audioRange?: number;
  hideRangesForChallenge?: { start: number; end: number }[];
  unhide?: number;
  editorState?: EditorStateType;
}) {
  if (!content) return <>Empty</>;
  const visibleContent = showHints
    ? content
    : {
        ...content,
        hintMap: [],
        hints: undefined,
        hints_pronunciation: undefined,
      };
  let hideRangesForChallengeEntry = hideRangesForChallenge
    ? hideRangesForChallenge[0]
    : hideRangesForChallenge;

  if (hideRangesForChallengeEntry) {
    if (unhide === -1) hideRangesForChallengeEntry = undefined;
    else if (unhide && unhide > hideRangesForChallengeEntry.start)
      hideRangesForChallengeEntry = {
        start: unhide,
        end: Math.max(hideRangesForChallengeEntry.end, unhide),
      };
  }
  const editor = editorState;

  const showTrans = showTranslationsInline ?? false;

  function overlaps(
    start1: number,
    end1: number,
    start2: number,
    end2: number,
  ) {
    if (start2 === end2) return false;
    if (start2 === undefined || end2 === undefined) return false;
    if (start1 <= start2 && start2 < end1) return true;
    return start2 <= start1 && start1 < end2;
  }

  function wasHiddenForChallenge(start: number, end: number) {
    return hideRangesForChallenge?.some((range) =>
      overlaps(start, end, range.start, range.end),
    );
  }

  function getHiddenState(start: number, end: number): HiddenState {
    let is_hidden: HiddenState =
      hideRangesForChallengeEntry !== undefined &&
      overlaps(
        start,
        end,
        hideRangesForChallengeEntry.start,
        hideRangesForChallengeEntry.end,
      )
        ? true
        : undefined;
    if (is_hidden && editor) is_hidden = "editor";
    return is_hidden;
  }

  function renderTextSegment(start: number, end: number) {
    const was_hidden_for_challenge = wasHiddenForChallenge(start, end);
    const is_hidden = getHiddenState(start, end);
    const style: CSSProperties = {};
    if (audioRange && audioRange < start) style.opacity = 0.5;
    if (was_hidden_for_challenge && !is_hidden) {
      Object.assign(style, revealedUnderlineStyle);
    }
    if (is_hidden) {
      Object.assign(style, hiddenUnderlineStyle);
    }

    const returns = [
      <span
        className={cn(
          "select-text",
          is_hidden === true && "select-none text-[var(--body-background)]",
          is_hidden === "editor" && "opacity-70",
        )}
        key={start + " " + end}
        style={
          was_hidden_for_challenge || is_hidden
            ? { ...underlineBaseStyle, ...style }
            : style
        }
        data-hidden={is_hidden}
        data-revealed={
          was_hidden_for_challenge && !is_hidden ? true : undefined
        }
      >
        {visibleContent.text.substring(start, end)}
      </span>,
    ];
    if (visibleContent.text.substring(start, end).indexOf("\n") !== -1)
      returns.push(<br key={start + " " + end + " br"} />);
    // add the span and optionally add a line break
    return returns;
  }

  function renderSplitText(start: number, end: number) {
    let parts = splitTextTokens(visibleContent.text.substring(start, end));
    if (parts[0] === "") parts.splice(0, 1);
    if (parts[parts.length - 1] === "") parts.pop();

    if (parts.length === 1) {
      return renderTextSegment(start, end);
    }
    let elements = [];
    for (let p of parts) {
      for (let w of renderTextSegment(start, start + p.length))
        elements.push(w);
      start += p.length;
    }
    return elements;
  }

  function renderPronunciation(
    hint_pronunciation: string,
    is_hidden: boolean | undefined,
    inlineHintUnderlineStyle: CSSProperties | undefined,
    children: React.ReactNode,
  ) {
    return (
      <span className="group/pronunciation relative inline-block">
        <span style={inlineHintUnderlineStyle}>{children}</span>
        <span
          className={cn(
            "pointer-events-none invisible absolute bottom-[calc(100%-6px)] left-1/2 whitespace-nowrap text-[0.62em] leading-none opacity-0 transition-opacity duration-200",
            !is_hidden &&
              "group-hover/tooltip:visible group-hover/tooltip:opacity-95",
            !is_hidden &&
              "group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-95",
            showTrans &&
              "group-hover/editorhint:visible group-hover/editorhint:opacity-95",
            showTrans &&
              "group-focus-within/editorhint:visible group-focus-within/editorhint:opacity-95",
            "group-hover/pronunciation:visible group-hover/pronunciation:opacity-95",
            "group-focus-within/pronunciation:visible group-focus-within/pronunciation:opacity-95",
          )}
          style={{ transform: "translateX(-50%)" }}
        >
          {hint_pronunciation}
        </span>
      </span>
    );
  }

  function renderTooltip(
    hint_translation: string,
    hint_pronunciation: string | undefined,
    hintTextClassName: string,
  ) {
    return (
      <span
        className={cn(
          "bottom-full left-1/2 z-10 mb-1 rounded-[14px] border-2 px-[17px] pt-[7px] pb-[6px] text-center text-[19px]",
          hint_pronunciation && "bottom-[calc(115%+4px)] mb-2",
          hintTextClassName,
        )}
        data-hint-tooltip
        style={
          hint_pronunciation
            ? {
                ...tooltipContentWithPronunciationStyle,
                transform: "translateX(-50%)",
              }
            : {
                ...tooltipContentStyle,
                transform: "translateX(-50%)",
              }
        }
      >
        <span>{hint_translation}</span>
        <span
          aria-hidden={true}
          className="absolute top-full left-1/2 z-10 mt-[-6px] ml-[-5px] h-[10px] w-[10px] rotate-[-45deg] border-2"
          style={tooltipArrowStyle}
        />
      </span>
    );
  }

  let elements = [];
  let text_pos = 0;
  for (let hint of visibleContent.hintMap) {
    if (hint.rangeFrom > text_pos) {
      elements.push(renderSplitText(text_pos, hint.rangeFrom));
    }

    let is_hidden: boolean | undefined =
      hideRangesForChallengeEntry !== undefined &&
      overlaps(
        hint.rangeFrom,
        hint.rangeTo,
        hideRangesForChallengeEntry.start,
        hideRangesForChallengeEntry.end,
      )
        ? true
        : undefined;
    if (editor) is_hidden = false;
    const hint_translation = visibleContent.hints?.[hint.hintIndex];
    const hint_pronunciation =
      visibleContent.hints_pronunciation?.[hint.hintIndex];
    const has_any_hint = Boolean(hint_translation || hint_pronunciation);
    const has_translation_hint = Boolean(hint_translation);
    const isInteractive = !is_hidden && !showTrans && has_translation_hint;
    const was_hidden_for_challenge = wasHiddenForChallenge(
      hint.rangeFrom,
      hint.rangeTo + 1,
    );
    const inlineHintUnderlineStyle =
      !showTrans &&
      has_translation_hint &&
      !is_hidden &&
      !was_hidden_for_challenge
        ? tooltipContainerStyle
        : undefined;

    const hintText = renderSplitText(hint.rangeFrom, hint.rangeTo + 1);
    const word_content = hint_pronunciation ? (
      renderPronunciation(
        hint_pronunciation,
        is_hidden,
        inlineHintUnderlineStyle,
        hintText,
      )
    ) : (
      <span style={inlineHintUnderlineStyle}>{hintText}</span>
    );
    const hintContainerClassName = is_hidden
      ? ""
      : showTrans
        ? has_any_hint
          ? "group/editorhint inline-flex grow flex-col"
          : ""
        : has_translation_hint
          ? cn(
              "group/tooltip relative inline-block align-baseline",
              "focus:outline-none focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2",
            )
          : "";
    const hintTextClassName = showTrans
      ? cn("italic opacity-50", visibleContent.lang_hints)
      : cn(
          "pointer-events-none invisible absolute block w-auto whitespace-nowrap text-center font-normal not-italic opacity-0 transition-opacity duration-300 group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100",
          visibleContent.lang_hints,
        );

    elements.push(
      <Tooltip
        key={`${hint.rangeFrom} ${hint.rangeTo + 1}`}
        className={cn(
          "select-text",
          showTrans && has_any_hint && "border-s border-[#bfbfbf] ps-[5px]",
          hintContainerClassName,
        )}
        interactive={isInteractive}
        data-revealed={
          was_hidden_for_challenge && !is_hidden ? true : undefined
        }
      >
        {word_content}
        {showTrans ? (
          has_any_hint ? (
            <span
              className={cn(
                "ms-[-4px] bg-[var(--editor-hints-background)] ps-[6px] text-[0.9em]",
                hintTextClassName,
              )}
            >
              {hint_translation ? <span>{hint_translation}</span> : null}
              {hint_pronunciation ? (
                <span className="mt-0.5 block opacity-90">
                  {hint_pronunciation}
                </span>
              ) : null}
            </span>
          ) : null
        ) : has_translation_hint ? (
          renderTooltip(hint_translation, hint_pronunciation, hintTextClassName)
        ) : null}
      </Tooltip>,
    );
    text_pos = hint.rangeTo + 1;
  }
  if (text_pos < visibleContent.text.length) {
    elements.push(renderSplitText(text_pos, visibleContent.text.length));
  }

  return elements;
}
export default StoryLineHints;
