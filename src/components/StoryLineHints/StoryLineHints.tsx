import React, { CSSProperties } from "react";
import { ContentWithHints } from "@/components/editor/story/syntax_parser_types";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import { cn } from "@/lib/utils";

type HiddenState = boolean | undefined | "editor";
type InlineHintStyle = CSSProperties | undefined;

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

function getVisibleContent(content: ContentWithHints, showHints: boolean) {
  if (showHints) return content;
  return {
    ...content,
    hintMap: [],
    hints: undefined,
    hints_pronunciation: undefined,
  };
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
  const visibleContent = getVisibleContent(content, showHints);
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
    let isHidden: HiddenState =
      hideRangesForChallengeEntry !== undefined &&
      overlaps(
        start,
        end,
        hideRangesForChallengeEntry.start,
        hideRangesForChallengeEntry.end,
      )
        ? true
        : undefined;
    if (isHidden && editor) isHidden = "editor";
    return isHidden;
  }

  function getHintHiddenState(start: number, end: number): boolean | undefined {
    const hiddenState = getHiddenState(start, end);
    return hiddenState ? true : undefined;
  }

  function getInlineHintUnderlineStyle(
    hasTranslationHint: boolean,
    isHidden: boolean | undefined,
    wasHidden: boolean | undefined,
  ): InlineHintStyle {
    return !showTrans && hasTranslationHint && !isHidden && !wasHidden
      ? tooltipContainerStyle
      : undefined;
  }

  function buildHintRenderState(hint: ContentWithHints["hintMap"][number]) {
    const isHidden = getHintHiddenState(hint.rangeFrom, hint.rangeTo);
    const hintTranslation = visibleContent.hints?.[hint.hintIndex];
    const hintPronunciation =
      visibleContent.hints_pronunciation?.[hint.hintIndex];
    const hasAnyHint = Boolean(hintTranslation || hintPronunciation);
    const hasTranslationHint = Boolean(hintTranslation);
    const isInteractive = !isHidden && !showTrans && hasTranslationHint;
    const wasHidden = wasHiddenForChallenge(hint.rangeFrom, hint.rangeTo + 1);
    const inlineUnderlineStyle = getInlineHintUnderlineStyle(
      hasTranslationHint,
      isHidden,
      wasHidden,
    );

    return {
      hasAnyHint,
      hasTranslationHint,
      hintPronunciation,
      hintTranslation,
      inlineUnderlineStyle,
      isHidden,
      isInteractive,
      wasHidden,
    };
  }

  function renderTextSegment(start: number, end: number) {
    const wasHidden = wasHiddenForChallenge(start, end);
    const isHidden = getHiddenState(start, end);
    const segmentText = visibleContent.text.substring(start, end);
    const style: CSSProperties = {};
    if (audioRange && audioRange < start) style.opacity = 0.5;
    if (wasHidden && !isHidden) {
      Object.assign(style, revealedUnderlineStyle);
    }
    if (isHidden) {
      Object.assign(style, hiddenUnderlineStyle);
    }

    const returns = [
      <span
        className={cn(
          "select-text",
          isHidden === true && "select-none text-[var(--body-background)]",
          isHidden === "editor" && "opacity-70",
        )}
        key={start + " " + end}
        style={
          wasHidden || isHidden ? { ...underlineBaseStyle, ...style } : style
        }
        data-hidden={isHidden}
        data-revealed={wasHidden && !isHidden ? true : undefined}
      >
        {segmentText}
      </span>,
    ];
    if (segmentText.includes("\n"))
      returns.push(<br key={start + " " + end + " br"} />);
    return returns;
  }

  function renderSplitText(start: number, end: number) {
    const text = visibleContent.text.substring(start, end);
    let parts = splitTextTokens(text);
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
    hintPronunciation: string,
    isHidden: boolean | undefined,
    inlineHintUnderlineStyle: InlineHintStyle,
    children: React.ReactNode,
  ) {
    return (
      <span className="group/pronunciation relative inline-block">
        <span style={inlineHintUnderlineStyle}>{children}</span>
        <span
          className={cn(
            "pointer-events-none invisible absolute bottom-[calc(100%-6px)] left-1/2 whitespace-nowrap text-[0.62em] leading-none opacity-0 transition-opacity duration-200",
            !isHidden &&
              "group-hover/tooltip:visible group-hover/tooltip:opacity-95",
            !isHidden &&
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
          {hintPronunciation}
        </span>
      </span>
    );
  }

  function renderTooltip(
    hintTranslation: string,
    hintPronunciation: string | undefined,
    hintTextClassName: string,
  ) {
    return (
      <span
        className={cn(
          "bottom-full left-1/2 z-10 mb-1 rounded-[14px] border-2 px-[17px] pt-[7px] pb-[6px] text-center text-[19px]",
          hintPronunciation && "bottom-[calc(115%+4px)] mb-2",
          hintTextClassName,
        )}
        data-hint-tooltip
        style={
          hintPronunciation
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
        <span>{hintTranslation}</span>
        <span
          aria-hidden={true}
          className="absolute top-full left-1/2 z-10 mt-[-6px] ml-[-5px] h-[10px] w-[10px] rotate-[-45deg] border-2"
          style={tooltipArrowStyle}
        />
      </span>
    );
  }

  let elements = [];
  let textPos = 0;
  for (let hint of visibleContent.hintMap) {
    if (hint.rangeFrom > textPos) {
      elements.push(renderSplitText(textPos, hint.rangeFrom));
    }

    const {
      hasAnyHint,
      hasTranslationHint,
      hintPronunciation,
      hintTranslation,
      inlineUnderlineStyle,
      isHidden,
      isInteractive,
      wasHidden,
    } = buildHintRenderState(hint);
    const hintText = renderSplitText(hint.rangeFrom, hint.rangeTo + 1);
    const wordContent = hintPronunciation ? (
      renderPronunciation(
        hintPronunciation,
        isHidden,
        inlineUnderlineStyle,
        hintText,
      )
    ) : (
      <span style={inlineUnderlineStyle}>{hintText}</span>
    );
    const hintContainerClassName = isHidden
      ? ""
      : showTrans
        ? hasAnyHint
          ? "group/editorhint inline-flex grow flex-col"
          : ""
        : hasTranslationHint
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
          showTrans && hasAnyHint && "border-s border-[#bfbfbf] ps-[5px]",
          hintContainerClassName,
        )}
        interactive={isInteractive}
        data-revealed={wasHidden && !isHidden ? true : undefined}
      >
        {wordContent}
        {showTrans ? (
          hasAnyHint ? (
            <span
              className={cn(
                "ms-[-4px] bg-[var(--editor-hints-background)] ps-[6px] text-[0.9em]",
                hintTextClassName,
              )}
            >
              {hintTranslation ? <span>{hintTranslation}</span> : null}
              {hintPronunciation ? (
                <span className="mt-0.5 block opacity-90">
                  {hintPronunciation}
                </span>
              ) : null}
            </span>
          ) : null
        ) : hasTranslationHint ? (
          renderTooltip(hintTranslation!, hintPronunciation, hintTextClassName)
        ) : null}
      </Tooltip>,
    );
    textPos = hint.rangeTo + 1;
  }
  if (textPos < visibleContent.text.length) {
    elements.push(renderSplitText(textPos, visibleContent.text.length));
  }

  return elements;
}
export default StoryLineHints;
