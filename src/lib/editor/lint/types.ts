import type { StoryElement } from "@/components/editor/story/syntax_parser_types";

export type LintSeverity = "error" | "warning" | "info";

/**
 * A single lint finding. Findings never block saving — stories can be saved in
 * any unfinished state. They are shown in the editor so contributors can fix
 * issues before asking for a review.
 *
 * - "error": the story is broken or unsolvable for learners, or only works
 *   because of an internal emergency fallback that contributors must not
 *   rely on (e.g. a question without a marked correct answer)
 * - "warning": almost certainly a mistake; degrades the story but it plays
 * - "info": stylistic or possibly intentional; worth a look
 */
export type LintFinding = {
  rule: string;
  severity: LintSeverity;
  message: string;
  /** 1-based line in the story source. Findings without it apply to the whole story. */
  lineNumber?: number;
  sourceLine?: string;
};

export type LintCast = Record<
  string,
  { id: string; link?: string; speaker?: string; name?: string }
>;

/** Structural subset of the meta object returned by processStoryFile. */
export type LintMeta = {
  cast?: LintCast;
  icon?: string;
  set_id?: number;
  fromLanguageName?: string;
  from_language_name?: string;
  [key: string]: unknown;
};

export type LintInput = {
  /** Raw story source text (the DSL). */
  text: string;
  /** Parsed story from processStoryFile. */
  story: { elements: StoryElement[] };
  meta: LintMeta;
  /** Short code of the learning language; selects per-language rules. */
  learningLanguage?: string;
  /** Course has the no-audio tag: skip all audio rules. */
  noAudio?: boolean;
};
