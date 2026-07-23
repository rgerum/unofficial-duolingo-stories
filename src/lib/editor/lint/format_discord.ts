import type { LintFinding, LintSeverity } from "./types";

/**
 * Formats lint results as a Discord markdown message for the review bot.
 * Deliberately robotic in tone: everyone in the thread should know this is an
 * automated assessment, not a human review.
 */

/** Bump when rules change meaningfully, so old bot replies are attributable. */
export const LINT_VERSION = 1;

export type ReviewStoryInfo = {
  id: number;
  name: string;
  courseShort: string;
  status: string;
  approvalCount: number;
};

const SEVERITY_ORDER: Record<LintSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};
const SEVERITY_EMOJI: Record<LintSeverity, string> = {
  error: "🛑",
  warning: "⚠️",
  info: "ℹ️",
};

function escapeMarkdown(text: string) {
  return text.replace(/([\\*_~`|])/g, "\\$1");
}

function countLabel(findings: LintFinding[]) {
  const counts = new Map<LintSeverity, number>();
  for (const finding of findings) {
    counts.set(finding.severity, (counts.get(finding.severity) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const severity of ["error", "warning", "info"] as const) {
    const n = counts.get(severity) ?? 0;
    if (n > 0) parts.push(`${n} ${severity}${n === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
}

export function formatDiscordReview(
  story: ReviewStoryInfo,
  findings: LintFinding[],
  parserErrorCount: number,
  options: { maxFindings?: number; maxLength?: number } = {},
): string {
  const maxFindings = options.maxFindings ?? 15;
  const maxLength = options.maxLength ?? 1900;

  const editorUrl = `https://duostories.org/editor/story/${story.id}`;
  const header = `🤖 **Automatic story check** — [#${story.id} “${escapeMarkdown(story.name)}”](<${editorUrl}>) (${story.courseShort}, status: ${story.status}, ${story.approvalCount} approval${story.approvalCount === 1 ? "" : "s"})`;
  const footer =
    "-# Automated check (mechanical issues only, v" +
    LINT_VERSION +
    "). A human review is still needed, and findings can be wrong.";

  const lines: string[] = [header];

  if (parserErrorCount > 0) {
    lines.push(
      `🛑 **${parserErrorCount} parse error${parserErrorCount === 1 ? "" : "s"}** — parts of the story cannot be parsed, so the checks below may be incomplete. The editor shows the parse errors inline.`,
    );
  }

  if (findings.length === 0 && parserErrorCount === 0) {
    lines.push("✅ All automatic checks passed.");
    lines.push(footer);
    return lines.join("\n");
  }

  if (findings.length > 0) lines.push(`**${countLabel(findings)}**`);

  const sorted = [...findings].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      (a.lineNumber ?? 0) - (b.lineNumber ?? 0),
  );

  let shown = 0;
  let currentLength = lines.join("\n").length;
  // reserve room for the truncation notice and the footer
  const reserved = 120 + footer.length;
  for (const finding of sorted) {
    if (shown >= maxFindings) break;
    // ?line= deep links are supported by the editor page
    const lineLabel =
      finding.lineNumber !== undefined
        ? `[Line ${finding.lineNumber}](<${editorUrl}?line=${finding.lineNumber}>) — `
        : "";
    const line = `${SEVERITY_EMOJI[finding.severity]} ${lineLabel}${finding.message}`;
    if (currentLength + line.length + 1 > maxLength - reserved) break;
    lines.push(line);
    currentLength += line.length + 1;
    shown += 1;
  }
  if (shown < sorted.length) {
    lines.push(
      `…and ${sorted.length - shown} more — open the story in the editor to see everything.`,
    );
  }
  lines.push(footer);
  return lines.join("\n");
}
