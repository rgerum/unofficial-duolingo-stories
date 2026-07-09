// Single source of truth for which languages render through the native
// text-layout path (HintText renderMode="native") instead of the
// whitespace-based tokenizer.
//
// The tokenizer splits on whitespace and treats each run as an unbreakable
// atom, which is fine for space-delimited scripts but wrong for scripts that
// don't put spaces between words: CJK (ja/zh/ko) and Thai (th). Thai in
// particular writes whole clauses without spaces, so a tokenized line becomes
// one atom wider than the bubble and overflows (#580). The native path hands
// the text to the platform engine, which performs script-aware line breaking.
const NATIVE_TEXT_LAYOUT_LANGS = /^(ja|zh|ko|th)(-|$)/i;

export function shouldUseNativeTextLayout(lang?: string): boolean {
  if (!lang) return false;
  return NATIVE_TEXT_LAYOUT_LANGS.test(lang);
}
