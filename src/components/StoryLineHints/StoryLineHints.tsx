import React, { CSSProperties } from "react";
import { ContentWithHints } from "@/components/editor/story/syntax_parser_types";
import type { EditorStateType } from "@/app/editor/story/[story]/editor_state";
import { cn } from "@/lib/utils";

const underlineBaseClass =
  "bg-[position:0_100%] bg-repeat-x bg-[length:5px_2px] leading-[2em] pb-[5px]";
const revealedUnderlineStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--underline-dashed) 60%, rgba(255, 255, 255, 0) 0%)",
};
const hiddenUnderlineStyle: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, var(--underline-solid) 60%, var(--underline-solid) 60%)",
};
const editorHintContainerStyle: CSSProperties = {
  borderInlineStart: "1px solid #bfbfbf",
  paddingInlineStart: "5px",
};
const editorHintTextStyle: CSSProperties = {
  marginInlineStart: "-4px",
  paddingInlineStart: "6px",
};

function splitTextTokens(text: string, keep_tilde = true) {
  if (!text) return [];
  if (keep_tilde)
    //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}]+)/)
    return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}]+)/);
  //return text.split(/([\s\u2000-\u206F\u2E00-\u2E7F\\¡!"#$%&*,.\/:;<=>¿?@^_`{|}~]+)/)
  else return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}~]+)/);
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

  function positionTooltip() {
    if (!ref.current) return;
    const tooltipElement = ref.current.children[1];
    if (!(tooltipElement instanceof HTMLElement)) return;

    // Calculate the position of the tooltip
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let offset = 0;
    if (tooltipElement.style.left.split(" ").length >= 2) {
      offset = parseInt(
        tooltipElement.style.left.split(" ")[2].split("px)")[0],
      );
    }
    // Check if the tooltip would be cut off on the right
    if (tooltipRect.right + offset > window.innerWidth) {
      tooltipElement.style.left = `calc(50% + ${
        window.innerWidth - tooltipRect.right - offset
      }px)`;
    }
    // check if the tooltip would be cuf off on the left
    else if (tooltipRect.left - offset < 0) {
      tooltipElement.style.left = `calc(50% + ${-tooltipRect.left + offset}px)`;
    } else {
      tooltipElement.style.left = `50%`;
    }
  }
  return (
    <span
      onMouseEnter={positionTooltip}
      onFocus={positionTooltip}
      ref={ref}
      className={className}
      tabIndex={interactive ? 0 : undefined}
      {...delegated}
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

  function getOverlap(
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

  function addWord2(start: number, end: number) {
    const was_hidden_for_challenge = hideRangesForChallenge?.some((range) =>
      getOverlap(start, end, range.start, range.end),
    );
    let is_hidden: boolean | undefined | "editor" =
      hideRangesForChallengeEntry !== undefined &&
      getOverlap(
        start,
        end,
        hideRangesForChallengeEntry.start,
        hideRangesForChallengeEntry.end,
      )
        ? true
        : undefined;
    if (is_hidden && editor) is_hidden = "editor";
    const style: CSSProperties = {};
    //TODO
    //if(is_hidden && window.view)
    //    style.color = "#afafaf";
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
          (was_hidden_for_challenge || is_hidden) && underlineBaseClass,
          is_hidden === true && "select-none text-[var(--body-background)]",
          is_hidden === "editor" && "opacity-70",
        )}
        key={start + " " + end}
        style={style}
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

  function addSplitWord(start: number, end: number) {
    let parts = splitTextTokens(visibleContent.text.substring(start, end));
    if (parts[0] === "") parts.splice(0, 1);
    if (parts[parts.length - 1] === "") parts.pop();

    if (parts.length === 1) {
      return addWord2(start, end);
      //addWord(dom, start, end);
      //return dom;
    }
    let elements = [];
    for (let p of parts) {
      for (let w of addWord2(start, start + p.length)) elements.push(w);
      start += p.length;
    }
    // <span className="word">{content.text.substring(text_pos, hint.rangeFrom)}</span>
    return elements;
  }

  let elements = [];
  let text_pos = 0;
  // iterate over all hints
  for (let hint of visibleContent.hintMap) {
    // add the text since the last hint
    if (hint.rangeFrom > text_pos)
      elements.push(addSplitWord(text_pos, hint.rangeFrom));
    //addSplitWord(dom.append("span").attr("class", "word"), text_pos, hint.rangeFrom);

    // add the text with the hint
    let is_hidden =
      hideRangesForChallengeEntry !== undefined &&
      getOverlap(
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
    const was_hidden_for_challenge = hideRangesForChallenge?.some((range) =>
      getOverlap(hint.rangeFrom, hint.rangeTo + 1, range.start, range.end),
    );
    const word_content = hint_pronunciation ? (
      <ruby className="group/ruby relative inline-block [ruby-position:over]">
        <span>{addSplitWord(hint.rangeFrom, hint.rangeTo + 1)}</span>
        <rt
          className={cn(
            "pointer-events-none invisible absolute bottom-[calc(100%-6px)] left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.62em] leading-none opacity-0 transition-opacity duration-200",
            !is_hidden &&
              "group-hover/tooltip:visible group-hover/tooltip:opacity-95",
            !is_hidden &&
              "group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-95",
            showTrans &&
              "group-hover/editorhint:visible group-hover/editorhint:opacity-95",
            showTrans &&
              "group-focus-within/editorhint:visible group-focus-within/editorhint:opacity-95",
            "group-hover/ruby:visible group-hover/ruby:opacity-95",
            "group-focus-within/ruby:visible group-focus-within/ruby:opacity-95",
          )}
        >
          {hint_pronunciation}
        </rt>
      </ruby>
    ) : (
      <span>{addSplitWord(hint.rangeFrom, hint.rangeTo + 1)}</span>
    );
    const hintContainerClassName = is_hidden
      ? ""
      : showTrans
        ? has_any_hint
          ? "group/editorhint inline-flex grow flex-col"
          : ""
        : has_translation_hint
          ? cn(
              "group/tooltip relative",
              underlineBaseClass,
              "[--story-hint-underline:var(--underline-dashed)] bg-[image:linear-gradient(to_right,var(--story-hint-underline)_60%,rgba(255,255,255,0)_0%)] hover:[--story-hint-underline:var(--underline-dashed-highlight)] focus-within:[--story-hint-underline:var(--underline-dashed-highlight)] focus:outline-none focus-visible:rounded-[4px] focus-visible:outline-2 focus-visible:outline-[var(--tooltip-border)] focus-visible:outline-offset-2",
            )
          : "";
    const hintTextClassName = showTrans
      ? cn(
          "bg-[var(--editor-hints-background)] text-[0.9em] italic opacity-50",
          visibleContent.lang_hints,
        )
      : cn(
          "pointer-events-none invisible absolute bottom-[125%] left-1/2 z-10 mb-[10px] block w-auto -translate-x-1/2 whitespace-nowrap rounded-[14px] border-2 border-[var(--tooltip-border)] bg-[var(--tooltip-backgroud)] px-[17px] pt-[7px] pb-[6px] text-center text-[19px] font-normal not-italic text-[var(--tooltip-color)] opacity-0 transition-opacity duration-300 after:absolute after:top-full after:left-1/2 after:z-10 after:-mt-[6px] after:-ml-[5px] after:h-[10px] after:w-[10px] after:rotate-[-45deg] after:border-[2px] after:border-[transparent_transparent_var(--tooltip-border)_var(--tooltip-border)] after:bg-[var(--tooltip-backgroud)] after:content-[''] group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100",
          hint_translation &&
            hint_pronunciation &&
            "[transform:translate(-50%,-8px)]",
          visibleContent.lang_hints,
        );

    elements.push(
      <Tooltip
        key={hint.rangeFrom + " " + hint.rangeTo + 1}
        className={cn("select-text", hintContainerClassName)}
        interactive={isInteractive}
        style={showTrans && has_any_hint ? editorHintContainerStyle : undefined}
        data-revealed={
          was_hidden_for_challenge && !is_hidden ? true : undefined
        }
      >
        {word_content}
        {showTrans ? (
          has_any_hint ? (
            <span className={hintTextClassName} style={editorHintTextStyle}>
              {hint_translation ? <span>{hint_translation}</span> : null}
              {hint_pronunciation ? (
                <span className="mt-0.5 block opacity-90">
                  {hint_pronunciation}
                </span>
              ) : null}
            </span>
          ) : null
        ) : has_translation_hint ? (
          <span className={hintTextClassName}>
            <span>{hint_translation}</span>
          </span>
        ) : null}
      </Tooltip>,
    );
    //addSplitWord(dom.append("span").attr("class", "word tooltip"), hint.rangeFrom, hint.rangeTo+1)
    //    .append("span").attr("class", "tooltiptext").text(content.hints[hint.hintIndex]);
    // advance the position
    text_pos = hint.rangeTo + 1;
  }
  // add the text after the last hint
  if (text_pos < visibleContent.text.length)
    elements.push(addSplitWord(text_pos, visibleContent.text.length));
  //            addSplitWord(dom.append("span").attr("class", "word"), text_pos, content.text.length);

  return elements;
}
export default StoryLineHints;
