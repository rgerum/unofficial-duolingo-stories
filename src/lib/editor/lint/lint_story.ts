import {
  splitTextTokens,
  splitTextTokens2,
} from "@/components/editor/story/syntax_parser_new";
import { scanInlineTts } from "@/components/editor/story/inline_tts";
import type {
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import {
  resolveLanguageConfig,
  type ResolvedLintConfig,
} from "./language_configs";
import type { LintFinding, LintInput } from "./types";

/**
 * Mechanical story checks that run on top of the parser output. Everything
 * here is advisory: findings never block saving, so half-written stories can
 * be saved freely. See docs/review-checklists/ for the judgment-based
 * counterpart used by agentic reviews.
 */

type RawLine = { lineno: number; text: string };
type Block = { type: string; headerLineno: number; lines: RawLine[] };

type TextUnit = {
  kind: "speaker" | "answer";
  main: RawLine;
  trans?: RawLine;
  pron?: RawLine;
  audio?: RawLine;
};

// anchored at the start, unlike the parser's regex: the parser only tests
// top-level lines, while this walker tests every line, so a content line
// ending in a ] hide-range must not be mistaken for a block header
const BLOCK_HEADER_RE = /^\[([^\]]*)\](<(.+)>)?$/;
// same shape the parser uses to strip "Speaker5:", ">", "+", "-" prefixes
const LINE_PREFIX_RE = /\s*(?:>?\s*(\w*)\s*:|>|\+|-)\s*(\S.*\S|\S)\s*/;

const ANSWER_BLOCKS = new Set([
  "MULTIPLE_CHOICE",
  "CONTINUATION",
  "SELECT_PHRASE",
]);
const HIDE_RANGE_BLOCKS = new Set(["SELECT_PHRASE", "CONTINUATION"]);
const BRACKET_BLOCKS = new Set([
  "LINE",
  "HEADER",
  "SELECT_PHRASE",
  "CONTINUATION",
]);

function splitBlocks(text: string): { blocks: Block[]; todoLines: RawLine[] } {
  const blocks: Block[] = [];
  const todoLines: RawLine[] = [];
  let current: Block | undefined;
  let lineno = 0;
  for (const raw of text.split("\n")) {
    lineno += 1;
    const line = raw.trim().replace(/\u2067/, "");
    if (line.length === 0 || line.startsWith("#")) {
      if (line.includes("TODO")) todoLines.push({ lineno, text: line });
      continue;
    }
    const match = line.match(BLOCK_HEADER_RE);
    if (match) {
      current = { type: match[1], headerLineno: lineno, lines: [] };
      blocks.push(current);
      continue;
    }
    current?.lines.push({ lineno, text: line });
  }
  return { blocks, todoLines };
}

function groupUnits(lines: RawLine[]): TextUnit[] {
  const units: TextUnit[] = [];
  for (const line of lines) {
    const t = line.text;
    if (t.startsWith("~") || t.startsWith("^") || t.startsWith("$")) {
      const unit = units[units.length - 1];
      if (!unit) continue;
      if (t.startsWith("~")) unit.trans = line;
      else if (t.startsWith("^")) unit.pron = line;
      else unit.audio = line;
      continue;
    }
    if (t.startsWith("+") || t.startsWith("-")) {
      units.push({ kind: "answer", main: line });
    } else if (t.startsWith(">") || /\w*:/.test(t)) {
      units.push({ kind: "speaker", main: line });
    }
  }
  return units;
}

function countWords(tokens: string[]): number {
  let n = 0;
  for (let i = 0; i < tokens.length; i += 2) if (tokens[i] !== "") n += 1;
  return n;
}

/** Replicates generateHintMap's positional alignment of text and hint lines. */
function hintAlignment(text: string, hintLine: string) {
  const textList = splitTextTokens(text.replace(/\|/g, "⁠"));
  const hintList = splitTextTokens2(hintLine.replace(/\|/g, "⁠"));
  if (textList[0] === "") hintList.unshift("", "");
  return { textWords: countWords(textList), hintWords: countWords(hintList) };
}

/** Text after the speaker prefix with inline {tts} stripped; null if the parser already errors. */
function normalizedMainText(unit: TextUnit): string | null {
  const text = unit.main.text.match(LINE_PREFIX_RE)?.[2] ?? "";
  const scanned = scanInlineTts(text);
  if (scanned.errors.length > 0) return null;
  return scanned.normalizedText;
}

function lintUnitHints(unit: TextUnit, findings: LintFinding[]) {
  const text = normalizedMainText(unit);
  if (text === null) return;
  for (const [hintUnit, marker, rule] of [
    [unit.trans, "~", "hint-count-mismatch"],
    [unit.pron, "^", "pronunciation-count-mismatch"],
  ] as const) {
    if (!hintUnit) continue;
    const hintText =
      hintUnit.text.match(
        new RegExp(`\\s*\\${marker}\\s*(\\S.*\\S|\\S)\\s*`),
      )?.[1] ?? "";
    if (!hintText) continue;
    const { textWords, hintWords } = hintAlignment(text, hintText);
    if (textWords !== hintWords) {
      findings.push({
        rule,
        severity: "warning",
        message: `Text has ${textWords} word${textWords === 1 ? "" : "s"} but the '${marker}' line has ${hintWords} item${hintWords === 1 ? "" : "s"}. Use a standalone '~' to leave a word without a hint, and join words with '~' (e.g. "is~not").`,
        lineNumber: hintUnit.lineno,
        sourceLine: hintUnit.text,
      });
    }
  }
}

function singleBracketCounts(text: string) {
  const open = (text.match(/(?<!\[)\[(?!\[)/g) ?? []).length;
  const close = (text.match(/(?<!\])\](?!\])/g) ?? []).length;
  return { open, close };
}

// listening exercises that are unsolvable without audio, and what to convert
// them to per docs/story-publishing/without_tts
const LISTENING_BLOCKS: Record<string, string> = {
  ARRANGE: "POINT_TO_PHRASE",
  SELECT_PHRASE: "CONTINUATION",
};

function lintBlock(
  block: Block,
  noAudio: boolean,
  audioLines: number[],
  findings: LintFinding[],
) {
  if (block.type === "DATA") return;
  const units = groupUnits(block.lines);
  const speakerUnits = units.filter((u) => u.kind === "speaker");
  const answerUnits = units.filter((u) => u.kind === "answer");

  for (const unit of units) {
    lintUnitHints(unit, findings);
    if (unit.audio) audioLines.push(unit.audio.lineno);
  }

  if (noAudio && LISTENING_BLOCKS[block.type]) {
    findings.push({
      rule: "listening-question-no-audio",
      // a listening exercise without audio is unsolvable
      severity: "error",
      message: `A [${block.type}] is a listening exercise and cannot be solved in a no-audio course. Convert it to [${LISTENING_BLOCKS[block.type]}] — see duostories.org/docs/story-publishing/without_tts.`,
      lineNumber: block.headerLineno,
    });
  }

  if (BRACKET_BLOCKS.has(block.type)) {
    for (const unit of speakerUnits) {
      const text = normalizedMainText(unit);
      if (text === null) continue;
      const { open, close } = singleBracketCounts(text);
      if (open !== close) {
        findings.push({
          rule: "unmatched-bracket",
          // in SELECT_PHRASE/CONTINUATION a broken bracket means nothing gets
          // hidden, so the answer is visible to the learner
          severity: HIDE_RANGE_BLOCKS.has(block.type) ? "error" : "warning",
          message:
            "Unmatched hidden-range bracket. A hidden range needs both '[' and ']'; write '[[' or ']]' for a literal bracket.",
          lineNumber: unit.main.lineno,
          sourceLine: unit.main.text,
        });
      } else if (open > 1) {
        findings.push({
          rule: "multiple-hidden-ranges",
          severity: "warning",
          message:
            "More than one [...] range on this line — only the first one is used.",
          lineNumber: unit.main.lineno,
          sourceLine: unit.main.text,
        });
      }
    }
  }

  if (HIDE_RANGE_BLOCKS.has(block.type)) {
    const dataUnit = speakerUnits[1];
    if (dataUnit) {
      const text = normalizedMainText(dataUnit);
      if (text !== null) {
        const { open, close } = singleBracketCounts(text);
        if (open === 0 && close === 0) {
          findings.push({
            rule: "missing-hidden-range",
            severity: "error",
            message: `A [${block.type}] line needs a [...] range around the part the learner has to ${block.type === "SELECT_PHRASE" ? "select" : "continue"} — without it the answer is not hidden.`,
            lineNumber: dataUnit.main.lineno,
            sourceLine: dataUnit.main.text,
          });
        }
      }
    }
  }

  if (ANSWER_BLOCKS.has(block.type)) {
    const correct = answerUnits.filter((u) => u.main.text.startsWith("+"));
    if (answerUnits.length === 0) {
      findings.push({
        rule: "no-answers",
        severity: "error",
        message: `The [${block.type}] question has no answer options ('+'/'-' lines).`,
        lineNumber: block.headerLineno,
      });
    } else if (answerUnits.length === 1) {
      findings.push({
        rule: "single-answer",
        severity: "warning",
        message: `The [${block.type}] question has only one answer option.`,
        lineNumber: answerUnits[0].main.lineno,
      });
    }
    if (answerUnits.length > 0 && correct.length === 0) {
      findings.push({
        rule: "missing-correct-answer",
        severity: "error",
        message: "No answer is marked as correct with '+'.",
        lineNumber: answerUnits[0].main.lineno,
        sourceLine: answerUnits[0].main.text,
      });
    } else if (correct.length > 1) {
      findings.push({
        rule: "multiple-correct-answers",
        severity: "error",
        message: `${correct.length} answers are marked with '+' — mark exactly one answer as correct.`,
        lineNumber: correct[correct.length - 1].main.lineno,
      });
    }
    const answerKey = (unit: TextUnit) =>
      (unit.main.text.match(LINE_PREFIX_RE)?.[2] ?? "").toLowerCase().trim();
    const correctKeys = new Set(correct.map(answerKey));
    const seen = new Map<string, RawLine>();
    for (const unit of answerUnits) {
      const key = answerKey(unit);
      if (!key) continue;
      if (seen.has(key)) {
        // a duplicate of the correct answer makes the question unsolvable:
        // the learner cannot tell the correct option from the identical
        // wrong one
        const involvesCorrect = correctKeys.has(key);
        findings.push({
          rule: "duplicate-answer",
          severity: involvesCorrect ? "error" : "warning",
          message: involvesCorrect
            ? "Duplicate answer option — learners cannot tell the correct option from the identical wrong one."
            : "Duplicate answer option.",
          lineNumber: unit.main.lineno,
          sourceLine: unit.main.text,
        });
      } else seen.set(key, unit.main);
    }
  }

  if (block.type === "ARRANGE" || block.type === "POINT_TO_PHRASE") {
    const dataUnit = speakerUnits[1];
    const text = dataUnit ? normalizedMainText(dataUnit) : null;
    if (dataUnit && text !== null) {
      const buttons = (text.match(/\(([^)]*)\)/g) ?? []).length;
      const openParens = (text.match(/\(/g) ?? []).length;
      const closeParens = (text.match(/\)/g) ?? []).length;
      if (openParens !== closeParens) {
        findings.push({
          rule: "unmatched-parenthesis",
          severity: "warning",
          message: "Unmatched parenthesis in the tappable options.",
          lineNumber: dataUnit.main.lineno,
          sourceLine: dataUnit.main.text,
        });
      }
      if (buttons > 0 && buttons < 2) {
        findings.push({
          rule: "too-few-options",
          severity: "warning",
          message: `The [${block.type}] line has only one (...) option — learners need at least two.`,
          lineNumber: dataUnit.main.lineno,
          sourceLine: dataUnit.main.text,
        });
      }
      if (block.type === "POINT_TO_PHRASE" && buttons > 0) {
        const plus = (text.match(/\(\s*\+/g) ?? []).length;
        if (plus === 0) {
          findings.push({
            rule: "point-to-phrase-no-correct",
            severity: "error",
            message: "No option is marked as correct with (+...).",
            lineNumber: dataUnit.main.lineno,
            sourceLine: dataUnit.main.text,
          });
        } else if (plus > 1) {
          findings.push({
            rule: "point-to-phrase-multiple-correct",
            severity: "error",
            message:
              "Multiple options are marked with (+...) — only one can be correct.",
            lineNumber: dataUnit.main.lineno,
            sourceLine: dataUnit.main.text,
          });
        }
      }
    }
  }

  if (block.type === "MATCH") {
    const pairs: { phrase: string; translation: string; line: RawLine }[] = [];
    for (const line of block.lines) {
      const match = line.text.match(/-\s*(.*\S)\s*<>\s*(.*\S)\s*/);
      if (match) pairs.push({ phrase: match[1], translation: match[2], line });
    }
    if (pairs.length > 0 && pairs.length < 2) {
      findings.push({
        rule: "too-few-match-pairs",
        severity: "warning",
        message: "The [MATCH] question has fewer than two pairs.",
        lineNumber: block.headerLineno,
      });
    }
    for (const side of ["phrase", "translation"] as const) {
      const seen = new Set<string>();
      for (const pair of pairs) {
        const key = pair[side].toLowerCase();
        if (seen.has(key)) {
          findings.push({
            rule: "duplicate-match-word",
            severity: "error",
            message: `"${pair[side]}" appears twice in the [MATCH] pairs — learners cannot tell the pairs apart.`,
            lineNumber: pair.line.lineno,
            sourceLine: pair.line.text,
          });
        } else seen.add(key);
      }
    }
  }
}

function elementLineNumber(element: {
  editor?: { block_start_no?: number; start_no?: number; active_no?: number };
}) {
  return (
    element.editor?.active_no ??
    element.editor?.start_no ??
    element.editor?.block_start_no
  );
}

function lastWordStartIndex(text: string): number {
  let end = text.length - 1;
  while (end >= 0 && /[\s\p{P}\p{S}]/u.test(text[end])) end -= 1;
  if (end < 0) return -1;
  let start = end;
  while (start > 0 && !/[\s\p{P}\p{S}]/u.test(text[start - 1])) start -= 1;
  return start;
}

function lintAudio(
  element: StoryElementLine | StoryElementHeader,
  content: { text: string },
  findings: LintFinding[],
  missingAudioLines: number[],
) {
  const audio = element.audio;
  const lineNumber = elementLineNumber(element);
  const label = element.type === "HEADER" ? "The title" : "This line";
  if (!audio) return;
  if (!audio.url) {
    missingAudioLines.push(lineNumber ?? 0);
    return;
  }
  const keypoints = audio.keypoints ?? [];
  if (keypoints.length === 0) {
    findings.push({
      rule: "audio-no-timemarks",
      severity: "warning",
      message: `${label} has audio but no word timemarks — words will not be highlighted during playback.`,
      lineNumber,
    });
    return;
  }
  if (
    keypoints.some(
      (k) => Number.isNaN(k.rangeEnd) || Number.isNaN(k.audioStart),
    )
  ) {
    findings.push({
      rule: "audio-line-malformed",
      severity: "warning",
      message:
        "The '$' audio line is malformed (expected '$file;chars,ms;chars,ms;...'). Re-sync the audio.",
      lineNumber,
    });
    return;
  }
  // equal rangeEnds are normal: audio lines end with a ";0,ms" terminal
  // marker that repeats the last position with the audio end time
  for (let i = 1; i < keypoints.length; i += 1) {
    if (
      keypoints[i].rangeEnd < keypoints[i - 1].rangeEnd ||
      keypoints[i].audioStart < keypoints[i - 1].audioStart
    ) {
      findings.push({
        rule: "audio-timemarks-order",
        severity: "warning",
        message:
          "Audio timemarks are not in increasing order — re-sync the audio.",
        lineNumber,
      });
      break;
    }
  }
  const last = keypoints[keypoints.length - 1];
  // highlighting is word-granular, so only flag when the marks miss the last
  // word entirely — legacy audio lines are often a character short, which is
  // invisible to learners
  const lastWordStart = lastWordStartIndex(content.text);
  if (last.rangeEnd > content.text.length) {
    findings.push({
      rule: "audio-timemarks-stale",
      severity: "warning",
      message:
        "Audio timemarks point past the end of the text — the text changed after the audio was synced. Regenerate or re-sync the audio.",
      lineNumber,
    });
  } else if (lastWordStart >= 0 && last.rangeEnd <= lastWordStart) {
    findings.push({
      rule: "audio-timemarks-short",
      severity: "warning",
      message:
        "Audio timemarks stop before the end of the text — the last words will not be highlighted. Re-sync the audio.",
      lineNumber,
    });
  }
  const words = countWords(splitTextTokens(content.text));
  // only count marks that advance through the text; the ";0,ms" terminal
  // marker (and any repeated position) is not a word mark
  const wordMarks = keypoints.filter(
    (k, i) => i === 0 || k.rangeEnd > keypoints[i - 1].rangeEnd,
  ).length;
  // extra marks are harmless (TTS often marks punctuation separately); only
  // missing marks leave words unhighlighted
  if (words > 0 && wordMarks < words) {
    findings.push({
      rule: "audio-timemark-count",
      severity: "info",
      message: `Audio has only ${wordMarks} word timemark${wordMarks === 1 ? "" : "s"} for ${words} word${words === 1 ? "" : "s"} — some words will not be highlighted (contractions can legitimately differ).`,
      lineNumber,
    });
  }
}

function lintElements(
  input: LintInput,
  config: ResolvedLintConfig,
  audioEnabled: boolean,
  findings: LintFinding[],
) {
  let hasStraightQuotes = false;
  let hasCurlyQuotes = false;
  const missingAudioLines: number[] = [];

  for (const element of input.story.elements) {
    if (element.type !== "LINE" && element.type !== "HEADER") continue;
    const content =
      element.type === "LINE"
        ? element.line.content
        : element.learningLanguageTitleContent;
    const lineNumber = elementLineNumber(element);

    if (audioEnabled) lintAudio(element, content, findings, missingAudioLines);
    if (element.type !== "LINE") continue;

    const text = content.text;
    if (text.includes('"')) hasStraightQuotes = true;
    if (/[“”„]/.test(text)) hasCurlyQuotes = true;

    if (content.hintMap.length === 0 && countWords(splitTextTokens(text)) > 0) {
      findings.push({
        rule: "missing-hints",
        severity: "warning",
        message: "This line has no translation hints ('~' line).",
        lineNumber,
      });
    }

    const trimmed = text.trimEnd();
    if (
      config.requireTerminalPunctuation &&
      trimmed.length > 0 &&
      // any Unicode punctuation or symbol counts, so scripts with their own
      // sentence marks (danda, CJK, Arabic, ...) work without configuration
      !/[\p{P}\p{S}]/u.test(trimmed[trimmed.length - 1])
    ) {
      findings.push({
        rule: "no-terminal-punctuation",
        severity: "info",
        message: "This line does not end with punctuation.",
        lineNumber,
      });
    }

    // no double-space rule: older stories use extra spaces to optically align
    // the text with the translation line

    const repeated = text.match(/(^|[\s])(\p{L}{2,})[\s]+\2(?=[\s]|\p{P}|$)/iu);
    if (repeated) {
      findings.push({
        rule: "repeated-word",
        severity: "info",
        message: `The word "${repeated[2]}" appears twice in a row.`,
        lineNumber,
      });
    }

    for (const rule of config.customRules) {
      if (rule.pattern.test(text)) {
        findings.push({
          rule: rule.id,
          severity: rule.severity ?? "info",
          message: rule.message,
          lineNumber,
        });
      }
    }
  }

  if (missingAudioLines.length > 0) {
    const n = missingAudioLines.length;
    findings.push({
      rule: "missing-audio",
      severity: "warning",
      message:
        n === 1
          ? "1 line has no audio ('$' line). Record or generate it with the audio tools."
          : `${n} lines have no audio ('$' lines). Record or generate them with the audio tools.`,
      lineNumber: missingAudioLines[0] || undefined,
    });
  }

  if (hasStraightQuotes && hasCurlyQuotes) {
    findings.push({
      rule: "mixed-quote-styles",
      severity: "info",
      message:
        'The story mixes straight quotes (") and curly quotes (“ ”) — pick one style.',
    });
  }
}

function lintCast(
  input: LintInput,
  languageHasVoices: boolean,
  findings: LintFinding[],
) {
  const cast = input.meta.cast ?? {};
  for (const [id, member] of Object.entries(cast)) {
    if (id !== "0" && !member.name) {
      findings.push({
        rule: "unknown-speaker",
        severity: "warning",
        message: `Speaker${id} is not a character of this course. Add it to the course characters, or set icon_${id}= and speaker_${id}= in [DATA].`,
      });
    }
    if (!input.noAudio && languageHasVoices && !member.speaker) {
      findings.push({
        rule: "speaker-no-voice",
        severity: "warning",
        message: `${member.name || (id === "0" ? "The narrator" : `Speaker${id}`)} has no TTS voice configured — audio cannot be generated.`,
      });
    }
  }
}

function lintMeta(input: LintInput, findings: LintFinding[]) {
  if (!input.meta.icon) {
    findings.push({
      rule: "missing-icon",
      severity: "warning",
      message: "No story image set in [DATA] (icon=...).",
    });
  }
  if (!input.meta.set_id) {
    findings.push({
      rule: "missing-set",
      severity: "warning",
      message: "No set assigned in [DATA] (set=<set>|<index>).",
    });
  }
  if (!input.meta.fromLanguageName && !input.meta.from_language_name) {
    findings.push({
      rule: "missing-title-translation",
      severity: "warning",
      message:
        "No fromLanguageName in [DATA] — the story title in the base language is missing.",
    });
  }
  if (!input.story.elements.some((element) => element.type === "HEADER")) {
    findings.push({
      rule: "missing-header",
      severity: "warning",
      message: "The story has no [HEADER] block with a title.",
    });
  }
}

export function lintStory(input: LintInput): LintFinding[] {
  const findings: LintFinding[] = [];
  const config = resolveLanguageConfig(input.learningLanguage);
  const { blocks, todoLines } = splitBlocks(input.text);

  // A language with no TTS voices at all cannot generate audio anywhere, so a
  // single story-level finding replaces the per-line and per-speaker ones.
  const cast = Object.values(input.meta.cast ?? {});
  const languageHasVoices =
    cast.length === 0 || cast.some((member) => member.speaker);
  const audioEnabled = !input.noAudio && languageHasVoices;
  if (!input.noAudio && !languageHasVoices) {
    findings.push({
      rule: "no-language-voices",
      severity: "warning",
      message:
        "No TTS voices are configured for this language — audio cannot be generated. Ask an admin to add voices, or record audio manually.",
    });
  }

  const audioLines: number[] = [];
  for (const block of blocks) {
    lintBlock(block, Boolean(input.noAudio), audioLines, findings);
  }
  if (input.noAudio && audioLines.length > 0) {
    const n = audioLines.length;
    findings.push({
      rule: "audio-in-no-audio-course",
      severity: "warning",
      message: `${n === 1 ? "1 line has" : `${n} lines have`} audio ('$' line${n === 1 ? "" : "s"}) although the course is set to no-audio. If the TTS pronunciation is wrong, remove the audio; otherwise ask an admin to drop the no-audio flag.`,
      lineNumber: audioLines[0],
    });
  }
  lintElements(input, config, audioEnabled, findings);
  lintCast(input, languageHasVoices, findings);
  lintMeta(input, findings);
  for (const line of todoLines) {
    findings.push({
      rule: "todo",
      severity: "info",
      message: "Open TODO comment.",
      lineNumber: line.lineno,
      sourceLine: line.text,
    });
  }

  findings.sort((a, b) => (a.lineNumber ?? -1) - (b.lineNumber ?? -1));
  return findings;
}
