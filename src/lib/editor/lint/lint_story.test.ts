import test from "node:test";
import assert from "node:assert/strict";

import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import { lintStory } from "./lint_story";
import type { LintFinding } from "./types";

const testAvatars = {
  0: {
    id: 0,
    avatar_id: 0,
    language_id: 0,
    name: "Narrator",
    link: "",
    speaker: "fr-FR-Wavenet-C",
  },
  414: {
    id: 414,
    avatar_id: 414,
    language_id: 0,
    name: "Junior",
    link: "",
    speaker: "fr-FR-Wavenet-D",
  },
};

function lint(
  text: string,
  options: { learningLanguage?: string; noAudio?: boolean } = {},
) {
  const [story, meta] = processStoryFile(
    text,
    0,
    testAvatars,
    {
      learning_language: options.learningLanguage ?? "fr",
      from_language: "en",
    },
    "",
  );
  return lintStory({
    text,
    story,
    meta,
    learningLanguage: options.learningLanguage ?? "fr",
    noAudio: options.noAudio,
  });
}

function byRule(findings: LintFinding[], rule: string) {
  return findings.filter((finding) => finding.rule === rule);
}

test("flags a question without a marked correct answer as an error", () => {
  const findings = lint(`[MULTIPLE_CHOICE]
> What happened?
- Option one
- Option two`);
  const missing = byRule(findings, "missing-correct-answer");
  assert.equal(missing.length, 1);
  assert.equal(missing[0].severity, "error");
  // the first-option fallback is an internal emergency, not something to
  // mention to contributors
  assert.doesNotMatch(missing[0].message, /first/i);
});

test("accepts a question with exactly one correct answer", () => {
  const findings = lint(`[MULTIPLE_CHOICE]
> What happened?
+ Option one
- Option two`);
  assert.equal(byRule(findings, "missing-correct-answer").length, 0);
  assert.equal(byRule(findings, "multiple-correct-answers").length, 0);
});

test("flags multiple correct answers as an error", () => {
  const findings = lint(`[MULTIPLE_CHOICE]
> What happened?
+ Option one
+ Option two`);
  const multi = byRule(findings, "multiple-correct-answers");
  assert.equal(multi.length, 1);
  assert.equal(multi[0].severity, "error");
});

test("flags a question with a single option and duplicates", () => {
  const single = lint(`[MULTIPLE_CHOICE]
> What happened?
+ Option one`);
  assert.equal(byRule(single, "single-answer").length, 1);

  // a duplicate of the correct answer makes the question unsolvable
  const duplicateOfCorrect = lint(`[MULTIPLE_CHOICE]
> What happened?
+ Option one
- Option one`);
  assert.equal(
    byRule(duplicateOfCorrect, "duplicate-answer")[0].severity,
    "error",
  );

  const duplicateWrong = lint(`[MULTIPLE_CHOICE]
> What happened?
+ Right answer
- Option one
- Option one`);
  assert.equal(
    byRule(duplicateWrong, "duplicate-answer")[0].severity,
    "warning",
  );
});

test("flags translation hints that do not align with the text", () => {
  const findings = lint(`[LINE]
Speaker414: Bonjour le monde.
~ hello the`);
  const mismatches = byRule(findings, "hint-count-mismatch");
  assert.equal(mismatches.length, 1);
  assert.match(mismatches[0].message, /3 words/);
  assert.equal(mismatches[0].lineNumber, 3);
});

test("accepts aligned translation hints, including ~ placeholders and joins", () => {
  const findings = lint(`[LINE]
Speaker414: Bonjour le monde.
~ hello ~ world`);
  assert.equal(byRule(findings, "hint-count-mismatch").length, 0);

  const grouped = lint(`[LINE]
Speaker414: Il y~a un chat.
~ it there~is a cat`);
  assert.equal(byRule(grouped, "hint-count-mismatch").length, 0);
});

test("flags a line without audio unless the course has no audio", () => {
  const text = `[LINE]
Speaker414: Bonjour le monde.
~ hello the world`;
  assert.equal(byRule(lint(text), "missing-audio").length, 1);
  assert.equal(
    byRule(lint(text, { noAudio: true }), "missing-audio").length,
    0,
  );
});

test("flags stale audio timemarks pointing past the text", () => {
  const findings = lint(`[LINE]
Speaker414: Oui.
~ yes
$audio/x.mp3;10,100;10,100`);
  assert.equal(byRule(findings, "audio-timemarks-stale").length, 1);
});

test("flags timemarks that miss the last word, tolerates sub-word shortfalls", () => {
  // marks end at char 10, last word starts at 11 -> whole word missed
  const missing = lint(`[LINE]
Speaker414: Bonjour le monde.
~ hello the world
$audio/x.mp3;7,500;3,200`);
  assert.equal(byRule(missing, "audio-timemarks-short").length, 1);

  // marks end at 16 instead of 17 (legacy off-by-one) -> fine
  const offByOne = lint(`[LINE]
Speaker414: Bonjour le monde.
~ hello the world
$audio/x.mp3;7,500;3,200;6,300`);
  assert.equal(byRule(offByOne, "audio-timemarks-short").length, 0);
});

test("tolerates the ;0,ms terminal marker in audio lines", () => {
  const findings = lint(`[LINE]
Speaker414: Bonjour le monde.
~ hello the world
$audio/x.mp3;7,500;3,200;7,300;0,550`);
  assert.equal(byRule(findings, "audio-timemarks-order").length, 0);
  assert.equal(byRule(findings, "audio-timemark-count").length, 0);
});

test("accepts audio with one timemark per word", () => {
  const findings = lint(`[LINE]
Speaker414: Bonjour le monde.
~ hello the world
$audio/x.mp3;7,500;3,200;6,300`);
  assert.equal(byRule(findings, "audio-timemarks-stale").length, 0);
  assert.equal(byRule(findings, "audio-timemark-count").length, 0);
  assert.equal(byRule(findings, "missing-audio").length, 0);
});

test("flags a line without any translation hints", () => {
  const findings = lint(`[LINE]
Speaker414: Bonjour le monde.`);
  assert.equal(byRule(findings, "missing-hints").length, 1);
});

test("flags an unknown speaker", () => {
  const findings = lint(`[LINE]
Speaker999: Bonjour.
~ hello`);
  const unknown = byRule(findings, "unknown-speaker");
  assert.equal(unknown.length, 1);
  assert.match(unknown[0].message, /Speaker999/);
});

test("flags a SELECT_PHRASE without a hidden range", () => {
  const findings = lint(`[SELECT_PHRASE]
> Choose the phrase
Speaker414: Bonjour le monde.
~ hello the world
+ right
- wrong`);
  const missing = byRule(findings, "missing-hidden-range");
  assert.equal(missing.length, 1);
  assert.equal(missing[0].severity, "error");

  const ok = lint(`[SELECT_PHRASE]
> Choose the phrase
Speaker414: Bonjour [le monde].
~ hello the world
+ right
- wrong`);
  assert.equal(byRule(ok, "missing-hidden-range").length, 0);
});

test("does not mistake a line ending in ] for a block header", () => {
  // the ~ line is deliberately one hint short: the mismatch must be reported,
  // which fails if the Speaker line is misread as a block header
  const findings = lint(`[SELECT_PHRASE]
> Choose the phrase
Speaker414: Bonjour [le monde]
~ hello the
+ right
- wrong`);
  assert.equal(byRule(findings, "hint-count-mismatch").length, 1);
  assert.equal(byRule(findings, "missing-hidden-range").length, 0);
  assert.equal(byRule(findings, "no-answers").length, 0);
});

test("flags an unmatched hidden-range bracket", () => {
  const findings = lint(`[LINE]
Speaker414: Bonjour [le monde.
~ hello the world`);
  assert.equal(byRule(findings, "unmatched-bracket").length, 1);
});

test("flags POINT_TO_PHRASE without a (+...) correct option", () => {
  const findings = lint(`[POINT_TO_PHRASE]
> Which word?
Speaker414: (Un) (deux) trois.
~ one two three`);
  const noCorrect = byRule(findings, "point-to-phrase-no-correct");
  assert.equal(noCorrect.length, 1);
  assert.equal(noCorrect[0].severity, "error");
  assert.doesNotMatch(noCorrect[0].message, /first/i);
});

test("flags duplicate MATCH words", () => {
  const findings = lint(`[MATCH]
> Match the pairs
- chat <> cat
- chat <> tomcat`);
  assert.equal(byRule(findings, "duplicate-match-word").length, 1);
});

test("applies per-language typography rules", () => {
  const findings = lint(
    `[LINE]
Speaker414: Qué tal?
~ how so`,
    { learningLanguage: "es" },
  );
  assert.equal(byRule(findings, "es-inverted-question").length, 1);
});

test("flags listening exercises in no-audio courses", () => {
  const text = `[ARRANGE]
> Tap what you hear
Speaker414: [(Nej) (du har) (mange)].
~ no you~have many

[SELECT_PHRASE]
> Select the missing phrase
Speaker414: Bonjour [le monde].
~ hello the world
+ le monde
- la lune`;
  const noAudio = lint(text, { noAudio: true });
  const listening = byRule(noAudio, "listening-question-no-audio");
  assert.equal(listening.length, 2);
  assert.equal(listening[0].severity, "error");
  assert.match(listening[0].message, /POINT_TO_PHRASE/);
  assert.match(listening[1].message, /CONTINUATION/);

  assert.equal(byRule(lint(text), "listening-question-no-audio").length, 0);
});

test("flags audio lines in no-audio courses", () => {
  const text = `[LINE]
Speaker414: Bonjour le monde.
~ hello the world
$audio/x.mp3;7,500;3,200;6,300`;
  const findings = byRule(
    lint(text, { noAudio: true }),
    "audio-in-no-audio-course",
  );
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /1 line has/);
  assert.equal(byRule(lint(text), "audio-in-no-audio-course").length, 0);
});

test("aggregates missing audio into one finding per story", () => {
  const findings = lint(`[LINE]
Speaker414: Bonjour le monde.
~ hello the world

[LINE]
Speaker414: Salut.
~ hi`);
  const missing = byRule(findings, "missing-audio");
  assert.equal(missing.length, 1);
  assert.match(missing[0].message, /2 lines/);
});

test("collapses all audio findings when the language has no voices", () => {
  const voicelessAvatars = {
    0: { ...testAvatars[0], speaker: "" },
    414: { ...testAvatars[414], speaker: "" },
  };
  const [story, meta] = processStoryFile(
    `[LINE]
Speaker414: Bonjour le monde.
~ hello the world`,
    0,
    voicelessAvatars,
    { learning_language: "fr", from_language: "en" },
    "",
  );
  const findings = lintStory({ text: "", story, meta });
  assert.equal(byRule(findings, "no-language-voices").length, 1);
  assert.equal(byRule(findings, "missing-audio").length, 0);
  assert.equal(byRule(findings, "speaker-no-voice").length, 0);
});

test("accepts fromLanguageName and non-Latin sentence punctuation", () => {
  const findings = lint(`[DATA]
fromLanguageName=The Story

[LINE]
Speaker414: ଲୁସି ପହଞ୍ଚିଛି।
~ Lucy arrives`);
  assert.equal(byRule(findings, "missing-title-translation").length, 0);
  assert.equal(byRule(findings, "no-terminal-punctuation").length, 0);
});

test("reports TODO comments and missing metadata", () => {
  const findings = lint(`# TODO record audio
[LINE]
Speaker414: Bonjour.
~ hello`);
  assert.equal(byRule(findings, "todo").length, 1);
  assert.equal(byRule(findings, "missing-icon").length, 1);
  assert.equal(byRule(findings, "missing-set").length, 1);
  assert.equal(byRule(findings, "missing-header").length, 1);
});

test("a complete story passes without warnings or errors", () => {
  const findings = lint(`[DATA]
fromLanguageName = The Story
from_language_name = The Story
icon = icon123
set = 1|2

[HEADER]
> Une histoire
~ A story
$audio/h.mp3;3,300;9,400

[LINE]
Speaker414: Bonjour le monde.
~ hello the world
$audio/x.mp3;7,500;3,200;6,300`);
  const serious = findings.filter((f) => f.severity !== "info");
  assert.deepEqual(serious, []);
});
