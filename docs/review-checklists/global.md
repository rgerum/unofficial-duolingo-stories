# Global story review checklist

Instructions for the reviewing agent. You are reviewing a community-translated
Duolingo story written in the story DSL (blocks like `[LINE]`,
`[MULTIPLE_CHOICE]`; `~` lines are translation hints in the course's base
language; `$` lines are audio). The learning language and base language of the
course are given to you with the story.

Scope: judgment-based issues only. The mechanical lint already checks hint
alignment counts, missing audio/timemarks, question structure, and basic
typography — do not repeat its findings.

## Output format

Report each finding as:

- **Line:** source line number(s)
- **Category:** one of `characters`, `translation`, `questions`, `text`,
  `typography`, `audio`
- **Severity:** `must-fix` (learners see wrong content) / `should-fix`
  (clear mistake) / `suggestion` (style, taste)
- **Issue:** quote the offending text and state what is wrong
- **Fix:** the concrete suggested replacement

End with a one-paragraph overall verdict: is the story ready for approval,
and what are the highest-priority fixes. If you found nothing in a category,
say so briefly — do not invent findings to fill categories.

## 1. Characters and naming

- [ ] Character names are spelled identically everywhere — in the story text,
      in translation hints, and across all lines.
- [ ] Speaker tags match who is actually talking: the same character keeps the
      same `SpeakerN` id for the whole story, and dialogue content matches the
      speaker (nobody answers their own question).
- [ ] Pronouns and grammatical gender are consistent for each character, in
      both the story text and the translation hints.
- [ ] Register is consistent: if two characters use informal address with each
      other, they don't randomly switch to formal (or vice versa) without a
      plot reason.
- [ ] Names are not translated unless the course consistently localizes them.

## 2. Translation hints

- [ ] Hints are in the course's base language.
- [ ] Each hint translates the word *as used in this sentence*, not its most
      common dictionary sense.
- [ ] Multi-word expressions and idioms are hinted as a unit where the DSL
      allows (join with `~`), not word-by-word into nonsense.
- [ ] No machine-translation artifacts: leftover source words, English word
      order in a non-English base language, or hints that are just the learning
      language word copied over.
- [ ] Hidden-range `[...]` passages read as a sensible unit when hidden.

## 3. Questions

- [ ] The marked correct answer is actually correct according to the story
      text.
- [ ] Distractors are unambiguously wrong — a learner who understood the story
      cannot defensibly pick them — but still plausible.
- [ ] Question wording (base language) is natural and unambiguous.
- [ ] `[CONTINUATION]` options are all grammatical continuations of the
      prompt; only the correct one fits the meaning.
- [ ] `[MATCH]` pairs are real translations of each other and no distractor
      pair is also a valid match.
- [ ] Questions appear at reasonable intervals and test comprehension of what
      was just read.
- [ ] In no-audio courses: questions converted from listening exercises use
      meaning-based distractors, not the sound-alikes of the original (the
      lint already flags remaining `[ARRANGE]`/`[SELECT_PHRASE]` blocks; see
      docs/story-publishing/without_tts).

## 4. Story text quality

- [ ] Grammar and spelling in the learning language are correct.
- [ ] Phrasing is natural — how a native speaker would actually say it.
- [ ] Orthography is internally consistent (spelling variants, diacritics,
      transliteration choices).
- [ ] The story is coherent: no plot holes introduced by translation, no
      untranslated fragments left from the source story.
- [ ] Difficulty is roughly appropriate for the set the story is in (early
      sets: simpler vocabulary and grammar).

## 5. Punctuation and typography

- [ ] Quote style is consistent within the story and appropriate for the
      language (see the per-language checklist).
- [ ] Dialogue punctuation is consistent across lines.
- [ ] Sentence-final punctuation matches the sentence type (questions end as
      questions).
- [ ] See `languages/<short>.md` for language-specific conventions; those
      rules take precedence over the global ones.

## 6. Audio (only when audio can be reviewed)

- [ ] Names and loanwords are pronounced acceptably; if not, suggest an inline
      TTS pronunciation (`word{ipa}` syntax) or a `speaker_N` voice change.
- [ ] The chosen voices match the characters (e.g. gender, and no two main
      characters share one voice).
