import React, { useRef, ReactNode } from "react";
import styles from "./line_hints.module.css";

import { EditorContext } from "../story";
import type { ContentWithHints, HideRange } from "@/components/editor/story/syntax_parser_types";

function splitTextTokens(text: string, keep_tilde = true): string[] {
  if (!text) return [];
  if (keep_tilde)
    return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}]+)/);
  else return text.split(/([\s\\¡!"#$%&*,./:;<=>¿?@^_`{|}~]+)/);
}

interface TooltipProps {
  className: string;
  children: ReactNode;
}

function Tooltip({ className, children }: TooltipProps) {
  const ref = useRef<HTMLSpanElement>(null);
  function onMouseEnter() {
    if (!ref.current) return;
    const tooltipElement = ref.current.children[1] as HTMLElement;

    // Calculate the position of the tooltip
    const tooltipRect = tooltipElement.getBoundingClientRect();

    let offset = 0;
    if (tooltipElement.style.left.split(" ").length >= 2) {
      offset = parseInt(tooltipElement.style.left.split(" ")[2].split("px)"));
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
    <span onMouseEnter={onMouseEnter} ref={ref} className={className}>
      {...children}
    </span>
  );
}

interface HintLineContentProps {
  content: ContentWithHints;
  audioRange?: number;
  hideRangesForChallenge?: HideRange[];
  unhide?: number;
}

export default function HintLineContent({
  content,
  audioRange,
  hideRangesForChallenge: hideRangesProp,
  unhide,
}: HintLineContentProps) {
  const editor = React.useContext(EditorContext);

  if (!content) return <>Empty</>;

  let hideRange: HideRange | undefined = hideRangesProp?.[0];

  if (hideRange) {
    if (unhide === -1) hideRange = undefined;
    else if (unhide !== undefined && unhide > hideRange.start)
      hideRange = {
        start: unhide,
        end: hideRange.end,
      };
  }

  const show_trans = editor?.show_trans;

  function getOverlap(start1: number, end1: number, start2?: number, end2?: number): boolean {
    if (start2 === end2) return false;
    if (start2 === undefined || end2 === undefined) return false;
    if (start1 <= start2 && start2 < end1) return true;
    return start2 <= start1 && start1 < end2;
  }

  function addWord2(start: number, end: number): React.ReactElement[] {
    let is_hidden: boolean | string | undefined =
      hideRange !== undefined &&
      getOverlap(start, end, hideRange.start, hideRange.end)
        ? true
        : undefined;
    if (is_hidden && editor) is_hidden = "editor";
    const style: React.CSSProperties = {};
    if (audioRange !== undefined && audioRange < start) style.opacity = 0.5;

    const returns: React.ReactElement[] = [
      <span
        className={styles.word}
        key={start + " " + end}
        style={style}
        data-hidden={is_hidden}
      >
        {content.text.substring(start, end)}
      </span>,
    ];
    if (content.text.substring(start, end).indexOf("\n") !== -1)
      returns.push(<br key={start + " " + end + " br"} />);
    return returns;
  }

  function addSplitWord(start: number, end: number): React.ReactElement[] {
    const parts = splitTextTokens(content.text.substring(start, end));
    if (parts[0] === "") parts.splice(0, 1);
    if (parts[parts.length - 1] === "") parts.pop();

    if (parts.length === 1) {
      return addWord2(start, end);
    }
    const elements: React.ReactElement[] = [];
    let pos = start;
    for (const p of parts) {
      for (const w of addWord2(pos, pos + p.length)) elements.push(w);
      pos += p.length;
    }
    return elements;
  }

  const elements: React.ReactNode[] = [];
  let text_pos = 0;
  // iterate over all hints
  for (const hint of content.hintMap) {
    // add the text since the last hint
    if (hint.rangeFrom > text_pos)
      elements.push(addSplitWord(text_pos, hint.rangeFrom));

    // add the text with the hint
    let is_hidden: boolean | undefined =
      hideRange !== undefined &&
      getOverlap(hint.rangeFrom, hint.rangeTo, hideRange.start, hideRange.end)
        ? true
        : undefined;
    if (editor) is_hidden = false;

    elements.push(
      <Tooltip
        key={hint.rangeFrom + " " + hint.rangeTo + 1}
        className={
          styles.word +
          " " +
          (is_hidden ? "" : show_trans ? styles.tooltip_editor : styles.tooltip)
        }
      >
        <span>{addSplitWord(hint.rangeFrom, hint.rangeTo + 1)}</span>
        <span
          className={
            (show_trans ? styles.tooltiptext_editor : styles.tooltiptext) +
            " " +
            (content.lang_hints ?? "")
          }
        >
          {content.hints?.[hint.hintIndex]}
        </span>
      </Tooltip>,
    );
    // advance the position
    text_pos = hint.rangeTo + 1;
  }
  // add the text after the last hint
  if (text_pos < content.text.length)
    elements.push(addSplitWord(text_pos, content.text.length));

  return <>{elements}</>;
}
