import type { LintSeverity } from "./types";

/**
 * Per-language lint configuration for mechanical typography rules.
 *
 * This is the deterministic counterpart to the per-language review checklists
 * in docs/review-checklists/languages/. Rules that a regex can express belong
 * here; rules that need judgment belong in the checklist.
 *
 * To add a language, add an entry keyed by the language's short code (the
 * `short` field of the language, e.g. "es", "fr", "ja").
 */

export type LintRegexRule = {
  id: string;
  /** Finding is reported when the pattern matches a learning-language line. */
  pattern: RegExp;
  message: string;
  severity?: LintSeverity;
};

export type LanguageLintConfig = {
  /** Set false for languages that don't end sentences with punctuation. */
  requireTerminalPunctuation?: boolean;
  /** Language-specific typography rules applied to each learning-language line. */
  customRules?: LintRegexRule[];
};

export const languageLintConfigs: Record<string, LanguageLintConfig> = {
  es: {
    customRules: [
      {
        id: "es-inverted-question",
        pattern: /^(?!.*¿).*\?/s,
        message: "Question ends with '?' but has no opening '¿'.",
        severity: "warning",
      },
      {
        id: "es-inverted-exclamation",
        pattern: /^(?!.*¡).*!/s,
        message: "Exclamation ends with '!' but has no opening '¡'.",
        severity: "warning",
      },
    ],
  },
  fr: {
    customRules: [
      {
        id: "fr-space-before-punctuation",
        pattern: /\p{L}[!?;:]/u,
        message:
          "French typography puts a (narrow no-break) space before !, ?, ; and :.",
        severity: "info",
      },
      {
        id: "fr-guillemet-spacing",
        pattern: /«\S|\S»/u,
        message: "French guillemets take a space inside: « comme ça ».",
        severity: "info",
      },
    ],
  },
  ja: {
    customRules: [
      {
        id: "ja-halfwidth-punctuation",
        pattern: /[?!]/,
        message:
          "Japanese text usually uses the full-width punctuation ？ and ！.",
        severity: "info",
      },
    ],
  },
};

export type ResolvedLintConfig = {
  requireTerminalPunctuation: boolean;
  customRules: LintRegexRule[];
};

export function resolveLanguageConfig(short?: string): ResolvedLintConfig {
  const config = (short && languageLintConfigs[short]) || {};
  return {
    requireTerminalPunctuation: config.requireTerminalPunctuation ?? true,
    customRules: (config.customRules ?? []).map((rule) => ({
      ...rule,
      // strip a stray /g flag so .test() stays stateless
      pattern: new RegExp(
        rule.pattern.source,
        rule.pattern.flags.replace("g", ""),
      ),
    })),
  };
}
