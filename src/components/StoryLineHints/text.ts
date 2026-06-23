const closingPunctuationPattern =
  /([^\S\r\n])([!%),.:;?\]}\u2026\u00bb\u203a\u201d\u2019\u3002\u3001\uff0c\uff0e\uff01\uff1f\uff1b\uff1a\uff09\uff3d\uff5d\u3011\u300b\u300d\u300f\u3009]+)/g;

export function keepClosingPunctuationWithWord(text: string) {
  return text.replace(closingPunctuationPattern, "\u00a0$2");
}
