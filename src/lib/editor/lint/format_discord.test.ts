import test from "node:test";
import assert from "node:assert/strict";

import { formatDiscordReview } from "./format_discord";
import type { LintFinding } from "./types";

const story = {
  id: 9782,
  name: "To the *Station*!",
  courseShort: "eu-en",
  status: "feedback",
  approvalCount: 1,
};

function finding(overrides: Partial<LintFinding> = {}): LintFinding {
  return {
    rule: "test-rule",
    severity: "warning",
    message: "Something is off.",
    lineNumber: 12,
    ...overrides,
  };
}

test("clean story reports success with disclaimer", () => {
  const message = formatDiscordReview(story, [], 0);
  assert.match(message, /All automatic checks passed/);
  assert.match(message, /Automated check/);
  assert.match(message, /editor\/story\/9782/);
});

test("escapes markdown in story names", () => {
  const message = formatDiscordReview(story, [], 0);
  assert.match(message, /To the \\\*Station\\\*!/);
});

test("escapes brackets so names stay valid masked-link text", () => {
  const message = formatDiscordReview(
    { ...story, name: "The [Best] Day" },
    [],
    0,
  );
  assert.match(message, /The \\\[Best\\\] Day/);
});

test("orders findings by severity then line", () => {
  const message = formatDiscordReview(
    story,
    [
      finding({ severity: "info", lineNumber: 1, message: "info one" }),
      finding({ severity: "error", lineNumber: 50, message: "error fifty" }),
      finding({ severity: "warning", lineNumber: 2, message: "warn two" }),
    ],
    0,
  );
  const errorIndex = message.indexOf("error fifty");
  const warnIndex = message.indexOf("warn two");
  const infoIndex = message.indexOf("info one");
  assert.ok(errorIndex < warnIndex && warnIndex < infoIndex);
  assert.match(message, /1 error, 1 warning, 1 info/);
});

test("truncates long finding lists and stays under the limit", () => {
  const findings = Array.from({ length: 60 }, (_, i) =>
    finding({
      lineNumber: i + 1,
      message: `Finding number ${i + 1} with some extra words.`,
    }),
  );
  const message = formatDiscordReview(story, findings, 0);
  assert.ok(message.length <= 1900, `message too long: ${message.length}`);
  assert.match(message, /…and \d+ more/);
});

test("findings link their line number into the editor", () => {
  const message = formatDiscordReview(
    story,
    [finding({ lineNumber: 96, message: "Bad line." })],
    0,
  );
  assert.match(
    message,
    /\[Line 96\]\(<https:\/\/duostories\.org\/editor\/story\/9782\?line=96>\) — Bad line\./,
  );
});

test("reports parse errors prominently", () => {
  const message = formatDiscordReview(story, [], 2);
  assert.match(message, /2 parse errors/);
  assert.doesNotMatch(message, /All automatic checks passed/);
});
