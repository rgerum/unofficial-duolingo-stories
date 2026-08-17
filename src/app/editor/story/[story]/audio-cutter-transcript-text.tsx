"use client";

import React from "react";
import type { AudioMark } from "@/app/audio/_lib/audio/types";
import type { ContentWithHints } from "@/components/editor/story/syntax_parser_types";

// Mirrors the inline hint styling of the editor preview (StoryLineHints).
const hintContainerStyle: React.CSSProperties = {
  borderInlineStart: "1px solid #bfbfbf",
  paddingInlineStart: "5px",
};
const hintTextStyle: React.CSSProperties = {
  marginInlineStart: "-4px",
  paddingInlineStart: "6px",
  backgroundColor: "var(--editor-hints-background)",
  fontSize: "0.9em",
};

function renderTextRangeWithHighlightedWord(
  text: string,
  from: number,
  to: number,
  marks: AudioMark[],
  activeWordIndex: number,
  onPlayWord?: (markIndex: number) => void,
) {
  if (marks.length === 0) return [text.slice(from, to)];

  const parts: React.ReactNode[] = [];
  let cursor = from;

  marks.forEach((mark, index) => {
    const markStart = Math.max(mark.start, from);
    const markEnd = Math.min(mark.end, to);
    if (markEnd <= markStart) return;

    if (markStart > cursor) {
      parts.push(text.slice(cursor, markStart));
    }

    parts.push(
      <button
        key={`${markStart}-${markEnd}-${index}`}
        type="button"
        className={
          index === activeWordIndex
            ? "rounded-[8px] bg-[#0f5f83] px-1 py-0.5 font-semibold text-white ring-2 ring-[#d7e34f] shadow-[0_1px_0_rgba(255,255,255,0.2)]"
            : "rounded-[8px] px-1 py-0.5 transition-colors hover:bg-[rgba(28,176,246,0.12)]"
        }
        onClick={(event) => {
          event.stopPropagation();
          onPlayWord?.(index);
        }}
        onKeyDown={(event) => {
          // The transcript row around this button treats Enter/Space as "play
          // the whole segment" and preventDefaults it, which would swallow the
          // button's own activation.
          if (event.key !== "Enter" && event.key !== " ") return;
          event.stopPropagation();
        }}
      >
        {text.slice(markStart, markEnd)}
      </button>,
    );
    cursor = markEnd;
  });

  if (cursor < to) {
    parts.push(text.slice(cursor, to));
  }

  return parts;
}

/**
 * Renders a transcript line with the currently spoken word highlighted and the
 * hint translations stacked below their words, the way the editor preview shows
 * them with inline translations enabled.
 */
export function renderTranscriptContent(
  content: ContentWithHints,
  marks: AudioMark[],
  activeWordIndex: number,
  onPlayWord?: (markIndex: number) => void,
) {
  const text = content.text ?? "";
  const renderRange = (from: number, to: number) =>
    renderTextRangeWithHighlightedWord(
      text,
      from,
      to,
      marks,
      activeWordIndex,
      onPlayWord,
    );

  const hintMap = content.hintMap ?? [];
  const hints = content.hints as string[] | undefined;
  const pronunciations = content.hints_pronunciation as string[] | undefined;
  if (hintMap.length === 0) return renderRange(0, text.length);

  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  hintMap.forEach((hint, index) => {
    const hintStart = Math.max(hint.rangeFrom, cursor);
    const hintEnd = Math.min(hint.rangeTo + 1, text.length);
    if (hintEnd <= hintStart) return;

    if (hintStart > cursor) {
      nodes.push(
        <React.Fragment key={`plain-${cursor}`}>
          {renderRange(cursor, hintStart)}
        </React.Fragment>,
      );
    }

    const translation = hints?.[hint.hintIndex] ?? "";
    const pronunciation = pronunciations?.[hint.hintIndex] ?? "";
    const hasHint = Boolean(translation || pronunciation);

    nodes.push(
      <span
        key={`hint-${index}-${hintStart}`}
        className="my-0.5 inline-flex flex-col whitespace-nowrap"
        style={hasHint ? hintContainerStyle : undefined}
      >
        <span className="whitespace-nowrap">
          {renderRange(hintStart, hintEnd)}
        </span>
        {hasHint ? (
          <span
            className={`italic leading-snug opacity-50 ${content.lang_hints ?? ""}`}
            style={hintTextStyle}
          >
            {translation ? <span>{translation}</span> : null}
            {pronunciation ? (
              <span className="mt-0.5 block opacity-90">{pronunciation}</span>
            ) : null}
          </span>
        ) : null}
      </span>,
    );
    cursor = hintEnd;
  });

  if (cursor < text.length) {
    nodes.push(
      <React.Fragment key={`plain-${cursor}`}>
        {renderRange(cursor, text.length)}
      </React.Fragment>,
    );
  }

  return nodes;
}
