// Fixture content for the rendering benchmark (app/debug/benchmark.tsx).
//
// Hint ranges are computed from substrings at module load (see spec()), never
// hardcoded, so fixture text can be edited freely. Texts are short story-like
// sentences chosen to stress each script: ligatures (Arabic), conjuncts
// (Devanagari), stacked vowels (Thai), below-base forms (Telugu), no-space
// segmentation (CJK, Thai), diacritics (Vietnamese), and a custom font
// (sitelen pona). Semantics mirror one storyline ("the lost keys") so
// screenshots are comparable across languages.

import type {
  ContentWithHints,
  HideRange,
  StoryElementArrange,
  StoryElementLine,
  StoryElementMatch,
  StoryElementMultipleChoice,
  StoryElementPointToPhrase,
  StoryElementSelectPhrase,
} from "../story/types";

/** [substringInText, translation, pronunciation?] */
export type HintSpec = [string, string, string?];

let lineIndex = 0;
function nextIndex() {
  return lineIndex++;
}

/**
 * Build ContentWithHints, locating each hint substring in the text.
 * Repeated substrings resolve left-to-right (search resumes after the
 * previous match), matching how story authors mark tokens in order.
 */
export function spec(text: string, hints: HintSpec[] = []): ContentWithHints {
  const hintMap: ContentWithHints["hintMap"] = [];
  const hintTexts: string[] = [];
  const pronunciations: string[] = [];
  let searchFrom = 0;
  let hasPronunciation = false;
  for (const [substring, translation, pronunciation] of hints) {
    let start = text.indexOf(substring, searchFrom);
    if (start === -1) start = text.indexOf(substring);
    if (start === -1) {
      throw new Error(`benchmark fixture: "${substring}" not in "${text}"`);
    }
    const hintIndex = hintTexts.length;
    hintTexts.push(translation);
    pronunciations.push(pronunciation ?? "");
    if (pronunciation) hasPronunciation = true;
    hintMap.push({ hintIndex, rangeFrom: start, rangeTo: start + substring.length - 1 });
    searchFrom = start + substring.length;
  }
  return {
    text,
    hintMap,
    hints: hintTexts,
    ...(hasPronunciation ? { hints_pronunciation: pronunciations } : null),
  };
}

export function hideRange(text: string, phrase: string): HideRange {
  const start = text.indexOf(phrase);
  if (start === -1) {
    throw new Error(`benchmark fixture: hide phrase "${phrase}" not in "${text}"`);
  }
  return { start, end: start + phrase.length };
}

export function characterLine(
  lang: string,
  content: ContentWithHints,
  opts: { hide?: string; avatarUrl?: string; challengeType?: string } = {},
): StoryElementLine {
  return {
    type: "LINE",
    lang,
    trackingProperties: {
      line_index: nextIndex(),
      ...(opts.challengeType ? { challenge_type: opts.challengeType } : null),
    },
    ...(opts.hide
      ? { hideRangesForChallenge: [hideRange(content.text, opts.hide)] }
      : null),
    line: {
      type: "CHARACTER",
      characterId: "benchmark",
      ...(opts.avatarUrl ? { avatarUrl: opts.avatarUrl } : null),
      content,
    },
  };
}

export function proseLine(lang: string, content: ContentWithHints): StoryElementLine {
  return {
    type: "LINE",
    lang,
    trackingProperties: { line_index: nextIndex() },
    line: { type: "PROSE", content },
  };
}

export function titleLine(lang: string, content: ContentWithHints): StoryElementLine {
  return {
    type: "LINE",
    lang,
    trackingProperties: { line_index: nextIndex() },
    line: { type: "TITLE", content },
  };
}

export type LanguageFixture = {
  lang: string;
  /** Published course this stands in for (reference only). */
  courseShort: string;
  label: string;
  rtl: boolean;
  title: ContentWithHints;
  /** Short character line with several hinted words. */
  greeting: ContentWithHints;
  /** Long prose line that must wrap across 2+ lines. */
  long: ContentWithHints;
  /** Character line containing `hidePhrase` as a challenge-hidden range. */
  question: ContentWithHints;
  hidePhrase: string;
  /** Hint used for the auto-opened popup case (word + translation + pron.). */
  popupHint: HintSpec;
};

export const LANGUAGE_FIXTURES: LanguageFixture[] = [
  {
    lang: "es",
    courseShort: "es-en",
    label: "Spanish — Latin baseline",
    rtl: false,
    title: spec("Las llaves perdidas", [["llaves", "keys"], ["perdidas", "lost"]]),
    greeting: spec("¡Buenos días, Lucía! ¿Cómo estás hoy?", [
      ["Buenos días", "good morning"],
      ["Cómo", "how"],
      ["estás", "are you"],
      ["hoy", "today"],
    ]),
    long: spec(
      "Llevo toda la mañana buscando las llaves de mi coche, pero no las encuentro por ninguna parte.",
      [
        ["mañana", "morning"],
        ["buscando", "looking for"],
        ["llaves", "keys"],
        ["coche", "car"],
        ["ninguna parte", "nowhere"],
      ],
    ),
    question: spec("Quizás están en el bolsillo de mi abrigo viejo.", [
      ["Quizás", "maybe"],
      ["bolsillo", "pocket"],
      ["abrigo", "coat"],
      ["viejo", "old"],
    ]),
    hidePhrase: "el bolsillo de mi abrigo",
    popupHint: ["bolsillo", "pocket"],
  },
  {
    lang: "vi",
    courseShort: "vi-en",
    label: "Vietnamese — Latin with stacked diacritics",
    rtl: false,
    title: spec("Chùm chìa khóa bị mất", [["chìa khóa", "keys"], ["bị mất", "lost"]]),
    greeting: spec("Chào buổi sáng, chị Hương! Hôm nay chị thế nào?", [
      ["Chào buổi sáng", "good morning"],
      ["Hôm nay", "today"],
      ["thế nào", "how"],
    ]),
    long: spec(
      "Tôi đã tìm chìa khóa ô tô từ sáng đến giờ mà vẫn không thấy ở đâu cả.",
      [
        ["tìm", "to look for"],
        ["chìa khóa", "keys"],
        ["ô tô", "car"],
        ["sáng", "morning"],
        ["không thấy", "can't find"],
      ],
    ),
    question: spec("Có lẽ chúng ở trong túi áo khoác cũ của tôi.", [
      ["Có lẽ", "maybe"],
      ["túi", "pocket"],
      ["áo khoác", "coat"],
      ["cũ", "old"],
    ]),
    hidePhrase: "trong túi áo khoác cũ",
    popupHint: ["áo khoác", "coat"],
  },
  {
    lang: "ru",
    courseShort: "ru-en",
    label: "Russian — Cyrillic",
    rtl: false,
    title: spec("Потерянные ключи", [["Потерянные", "lost"], ["ключи", "keys"]]),
    greeting: spec("Доброе утро, Аня! Как ты себя чувствуешь сегодня?", [
      ["Доброе утро", "good morning"],
      ["Как", "how"],
      ["чувствуешь", "feel"],
      ["сегодня", "today"],
    ]),
    long: spec(
      "Я с самого утра ищу ключи от машины, но нигде не могу их найти.",
      [
        ["утра", "morning"],
        ["ищу", "look for"],
        ["ключи", "keys"],
        ["машины", "car"],
        ["нигде", "nowhere"],
      ],
    ),
    question: spec("Может быть, они в кармане моего старого пальто.", [
      ["Может быть", "maybe"],
      ["кармане", "pocket"],
      ["старого", "old"],
      ["пальто", "coat"],
    ]),
    hidePhrase: "в кармане моего старого пальто",
    popupHint: ["кармане", "pocket"],
  },
  {
    lang: "el",
    courseShort: "el-en",
    label: "Greek",
    rtl: false,
    title: spec("Τα χαμένα κλειδιά", [["χαμένα", "lost"], ["κλειδιά", "keys"]]),
    greeting: spec("Καλημέρα, Μαρία! Πώς είσαι σήμερα;", [
      ["Καλημέρα", "good morning"],
      ["Πώς", "how"],
      ["είσαι", "are you"],
      ["σήμερα", "today"],
    ]),
    long: spec(
      "Ψάχνω τα κλειδιά του αυτοκινήτου μου από το πρωί, αλλά δεν τα βρίσκω πουθενά.",
      [
        ["Ψάχνω", "I'm looking for"],
        ["κλειδιά", "keys"],
        ["αυτοκινήτου", "car"],
        ["πρωί", "morning"],
        ["πουθενά", "nowhere"],
      ],
    ),
    question: spec("Ίσως είναι στην τσέπη του παλιού μου παλτού.", [
      ["Ίσως", "maybe"],
      ["τσέπη", "pocket"],
      ["παλιού", "old"],
      ["παλτού", "coat"],
    ]),
    hidePhrase: "στην τσέπη του παλιού μου",
    popupHint: ["τσέπη", "pocket"],
  },
  {
    lang: "ar",
    courseShort: "ar-en",
    label: "Arabic — RTL, ligatures, contextual shaping",
    rtl: true,
    title: spec("المفاتيح الضائعة", [["المفاتيح", "the keys"], ["الضائعة", "lost"]]),
    greeting: spec("صباح الخير يا أمينة! كيف حالك اليوم؟", [
      ["صباح الخير", "good morning"],
      ["كيف", "how"],
      ["حالك", "are you"],
      ["اليوم", "today"],
    ]),
    long: spec(
      "أبحث عن مفاتيح سيارتي في كل مكان منذ الصباح، لكنني لا أجدها.",
      [
        ["أبحث عن", "I'm looking for"],
        ["مفاتيح", "keys"],
        ["سيارتي", "my car"],
        ["الصباح", "the morning"],
        ["لا أجدها", "I can't find them"],
      ],
    ),
    question: spec("ربما هي في جيب معطفي القديم.", [
      ["ربما", "maybe"],
      ["جيب", "pocket"],
      ["معطفي", "my coat"],
      ["القديم", "old"],
    ]),
    hidePhrase: "جيب معطفي القديم",
    popupHint: ["جيب", "pocket"],
  },
  {
    lang: "he",
    courseShort: "he-en",
    label: "Hebrew — RTL",
    rtl: true,
    title: spec("המפתחות האבודים", [["המפתחות", "the keys"], ["האבודים", "lost"]]),
    greeting: spec("בוקר טוב, דנה! מה שלומך היום?", [
      ["בוקר טוב", "good morning"],
      ["מה שלומך", "how are you"],
      ["היום", "today"],
    ]),
    long: spec(
      "אני מחפש את המפתחות של המכונית שלי כבר שעה, אבל אני לא מוצא אותם.",
      [
        ["מחפש", "looking for"],
        ["המפתחות", "the keys"],
        ["המכונית", "the car"],
        ["שעה", "an hour"],
        ["לא מוצא", "can't find"],
      ],
    ),
    question: spec("אולי הם בכיס של המעיל הישן שלי.", [
      ["אולי", "maybe"],
      ["בכיס", "in the pocket"],
      ["המעיל", "the coat"],
      ["הישן", "old"],
    ]),
    hidePhrase: "בכיס של המעיל הישן",
    popupHint: ["בכיס", "in the pocket"],
  },
  {
    lang: "ja",
    courseShort: "ja-en",
    label: "Japanese — CJK native layout path, furigana pronunciation",
    rtl: false,
    title: spec("なくした鍵", [["なくした", "lost"], ["鍵", "key", "かぎ"]]),
    greeting: spec("おはようございます、ゆきさん！今日は元気ですか。", [
      ["おはようございます", "good morning"],
      ["今日", "today", "きょう"],
      ["元気", "well", "げんき"],
    ]),
    long: spec(
      "朝からずっと車の鍵を探していますが、どこにも見つかりません。",
      [
        ["朝", "morning", "あさ"],
        ["車", "car", "くるま"],
        ["鍵", "key", "かぎ"],
        ["探して", "looking for", "さがして"],
        ["見つかりません", "can't find", "みつかりません"],
      ],
    ),
    question: spec("たぶん古いコートのポケットの中です。", [
      ["たぶん", "maybe"],
      ["古い", "old", "ふるい"],
      ["コート", "coat"],
      ["ポケット", "pocket"],
      ["中", "inside", "なか"],
    ]),
    hidePhrase: "コートのポケットの中",
    popupHint: ["鍵", "key", "かぎ"],
  },
  {
    lang: "zh",
    courseShort: "zh-en",
    label: "Chinese — CJK native layout path, pinyin pronunciation",
    rtl: false,
    title: spec("丢失的钥匙", [["丢失", "lost", "diūshī"], ["钥匙", "keys", "yàoshi"]]),
    greeting: spec("早上好，小美！你今天好吗？", [
      ["早上好", "good morning", "zǎoshang hǎo"],
      ["今天", "today", "jīntiān"],
      ["好吗", "how are you", "hǎo ma"],
    ]),
    long: spec(
      "我从早上就一直在找我的车钥匙，可是哪里都找不到。",
      [
        ["早上", "morning", "zǎoshang"],
        ["一直", "the whole time", "yīzhí"],
        ["找", "look for", "zhǎo"],
        ["车钥匙", "car keys", "chē yàoshi"],
        ["找不到", "can't find", "zhǎo bu dào"],
      ],
    ),
    question: spec("钥匙可能在我旧大衣的口袋里。", [
      ["可能", "maybe", "kěnéng"],
      ["旧", "old", "jiù"],
      ["大衣", "coat", "dàyī"],
      ["口袋", "pocket", "kǒudài"],
    ]),
    hidePhrase: "旧大衣的口袋里",
    popupHint: ["口袋", "pocket", "kǒudài"],
  },
  {
    lang: "ko",
    courseShort: "(no published course — exercises the ko native-text path)",
    label: "Korean — Hangul, CJK native layout path",
    rtl: false,
    title: spec("잃어버린 열쇠", [["잃어버린", "lost"], ["열쇠", "keys"]]),
    greeting: spec("좋은 아침이에요, 민지 씨! 오늘 기분이 어때요?", [
      ["좋은 아침", "good morning"],
      ["오늘", "today"],
      ["기분", "mood"],
      ["어때요", "how is"],
    ]),
    long: spec(
      "아침부터 계속 자동차 열쇠를 찾고 있는데 어디에서도 찾을 수가 없어요.",
      [
        ["아침", "morning"],
        ["자동차", "car"],
        ["열쇠", "keys"],
        ["찾고", "looking for"],
        ["없어요", "there isn't"],
      ],
    ),
    question: spec("아마 낡은 코트 주머니 안에 있을 거예요.", [
      ["아마", "maybe"],
      ["낡은", "old"],
      ["코트", "coat"],
      ["주머니", "pocket"],
    ]),
    hidePhrase: "코트 주머니 안에",
    popupHint: ["주머니", "pocket"],
  },
  {
    lang: "hi",
    courseShort: "hi-en",
    label: "Hindi — Devanagari, conjuncts and matras",
    rtl: false,
    title: spec("खोई हुई चाबियाँ", [["खोई हुई", "lost"], ["चाबियाँ", "keys"]]),
    greeting: spec("सुप्रभात, प्रिया! आज तुम कैसी हो?", [
      ["सुप्रभात", "good morning"],
      ["आज", "today"],
      ["कैसी", "how"],
    ]),
    long: spec(
      "मैं सुबह से अपनी गाड़ी की चाबियाँ ढूँढ रहा हूँ, लेकिन वे कहीं नहीं मिल रहीं।",
      [
        ["सुबह", "morning"],
        ["गाड़ी", "car"],
        ["चाबियाँ", "keys"],
        ["ढूँढ", "searching"],
        ["कहीं नहीं", "nowhere"],
      ],
    ),
    question: spec("शायद वे मेरे पुराने कोट की जेब में हैं।", [
      ["शायद", "maybe"],
      ["पुराने", "old"],
      ["कोट", "coat"],
      ["जेब", "pocket"],
    ]),
    hidePhrase: "कोट की जेब में",
    popupHint: ["जेब", "pocket"],
  },
  {
    lang: "te",
    courseShort: "tel-en",
    label: "Telugu — below-base forms, known clipping regressions",
    rtl: false,
    title: spec("పోయిన తాళం చెవులు", [["పోయిన", "lost"], ["తాళం చెవులు", "keys"]]),
    greeting: spec("శుభోదయం, ప్రియా! ఈరోజు ఎలా ఉన్నావు?", [
      ["శుభోదయం", "good morning"],
      ["ఈరోజు", "today"],
      ["ఎలా", "how"],
      ["ఉన్నావు", "are you"],
    ]),
    long: spec(
      "ఉదయం నుంచి నా కారు తాళం చెవుల కోసం వెతుకుతున్నాను, కానీ ఎక్కడా కనిపించడం లేదు.",
      [
        ["ఉదయం", "morning"],
        ["కారు", "car"],
        ["తాళం చెవుల", "keys"],
        ["వెతుకుతున్నాను", "I am searching"],
        ["ఎక్కడా", "anywhere"],
      ],
    ),
    question: spec("బహుశా అవి నా పాత కోటు జేబులో ఉన్నాయి.", [
      ["బహుశా", "maybe"],
      ["పాత", "old"],
      ["కోటు", "coat"],
      ["జేబులో", "in the pocket"],
    ]),
    hidePhrase: "పాత కోటు జేబులో",
    popupHint: ["జేబులో", "in the pocket"],
  },
  {
    lang: "th",
    courseShort: "th-en",
    label: "Thai — no spaces between words, stacked vowels/tone marks",
    rtl: false,
    title: spec("กุญแจที่หายไป", [["กุญแจ", "keys"], ["หายไป", "lost"]]),
    greeting: spec("สวัสดีตอนเช้าครับ คุณแนน วันนี้เป็นอย่างไรบ้าง", [
      ["สวัสดี", "hello"],
      ["ตอนเช้า", "in the morning"],
      ["วันนี้", "today"],
      ["อย่างไร", "how"],
    ]),
    long: spec(
      "ผมหากุญแจรถของผมมาตั้งแต่เช้า แต่ก็ยังหาไม่เจอเลย",
      [
        ["หา", "look for"],
        ["กุญแจ", "keys"],
        ["รถ", "car"],
        ["เช้า", "morning"],
        ["ไม่เจอ", "can't find"],
      ],
    ),
    question: spec("บางทีอาจจะอยู่ในกระเป๋าเสื้อโค้ตตัวเก่าของผม", [
      ["บางที", "maybe"],
      ["กระเป๋า", "pocket"],
      ["เสื้อโค้ต", "coat"],
      ["เก่า", "old"],
    ]),
    hidePhrase: "ในกระเป๋าเสื้อโค้ต",
    popupHint: ["กระเป๋า", "pocket"],
  },
  {
    lang: "dv",
    courseShort: "dv-en",
    label: "Dhivehi — Thaana script, RTL (smoke-level coverage)",
    rtl: true,
    title: spec("ގެއްލުނު ތަޅުދަނޑި", [["ތަޅުދަނޑި", "keys"]]),
    greeting: spec("ހެނދުނުގެ ސަލާމް! ކިހިނެއްތަ؟", [
      ["ހެނދުނުގެ ސަލާމް", "good morning"],
      ["ކިހިނެއްތަ", "how are you"],
    ]),
    long: spec("އަހަރެންގެ ކާރުގެ ތަޅުދަނޑި ހެނދުނުން ފެށިގެން ހޯދަނީ.", [
      ["ކާރުގެ", "car's"],
      ["ތަޅުދަނޑި", "keys"],
      ["ހޯދަނީ", "searching"],
    ]),
    question: spec("އެ ހުރީ ކޯޓުގެ ޖީބުގައި ކަންނޭނގެ.", [
      ["ކޯޓުގެ", "coat's"],
      ["ޖީބުގައި", "in the pocket"],
    ]),
    hidePhrase: "ކޯޓުގެ ޖީބުގައި",
    popupHint: ["ޖީބުގައި", "in the pocket"],
  },
  {
    lang: "tok2",
    courseShort: "tok-en",
    label: "toki pona — sitelen pona custom font (linja-pona)",
    rtl: false,
    title: spec("ilo open pi weka", [["ilo open", "key"], ["weka", "lost"]]),
    greeting: spec("toki! sina pilin seme?", [
      ["toki", "hello"],
      ["pilin", "feel"],
      ["seme", "what"],
    ]),
    long: spec("mi alasa e ilo open pi tomo tawa mi. taso mi lukin ala e ona.", [
      ["alasa", "search"],
      ["ilo open", "key"],
      ["tomo tawa", "car"],
      ["lukin ala", "not see"],
    ]),
    question: spec("ken la ona li lon poki pi len suli mi.", [
      ["ken la", "maybe"],
      ["poki", "pocket"],
      ["len suli", "coat"],
    ]),
    hidePhrase: "poki pi len suli",
    popupHint: ["poki", "pocket"],
  },
];

// ---------------------------------------------------------------------------
// Exercise fixtures (4 representative scripts: Latin, Arabic RTL, CJK, Indic)
// ---------------------------------------------------------------------------

export type ExerciseFixture = {
  lang: string;
  rtl: boolean;
  multipleChoice: StoryElementMultipleChoice;
  /** Line whose hidden range the select-phrase exercise fills in. */
  selectPhraseLine: StoryElementLine;
  selectPhrase: StoryElementSelectPhrase;
  /** Line the arrange exercise reveals; phrases in correct order. */
  arrangeLine: StoryElementLine;
  arrangePhrases: string[];
  pointToPhrase: StoryElementPointToPhrase;
  match: StoryElementMatch;
};

function mc(
  lang: string,
  question: string,
  answers: string[],
  correctAnswerIndex: number,
): StoryElementMultipleChoice {
  return {
    type: "MULTIPLE_CHOICE",
    lang,
    question: spec(question),
    answers,
    correctAnswerIndex,
    trackingProperties: { line_index: nextIndex(), challenge_type: "multiple-choice" },
  };
}

function selectPhrase(
  lang: string,
  answers: string[],
  correctAnswerIndex: number,
): StoryElementSelectPhrase {
  return {
    type: "SELECT_PHRASE",
    lang,
    answers,
    correctAnswerIndex,
    trackingProperties: { line_index: nextIndex(), challenge_type: "select-phrases" },
  };
}

function pointToPhrase(
  lang: string,
  question: string,
  parts: Array<string | { sel: string }>,
  correctSelectableIndex: number,
): StoryElementPointToPhrase {
  return {
    type: "POINT_TO_PHRASE",
    lang,
    lang_question: "en",
    question: spec(question),
    transcriptParts: parts.map((p) =>
      typeof p === "string"
        ? { selectable: false, text: p }
        : { selectable: true, text: p.sel },
    ),
    correctAnswerIndex: correctSelectableIndex,
    trackingProperties: { line_index: nextIndex(), challenge_type: "point-to-phrase" },
  };
}

function match(
  lang: string,
  pairs: Array<[string, string]>,
): StoryElementMatch {
  return {
    type: "MATCH",
    lang,
    lang_question: "en",
    prompt: "Tap the pairs",
    fallbackHints: pairs.map(([phrase, translation]) => ({ phrase, translation })),
    trackingProperties: { line_index: nextIndex(), challenge_type: "match" },
  };
}

/**
 * Build the ARRANGE element from the hidden line's text and its phrases in
 * correct order. characterPositions[i] is the char offset revealed once
 * phrase i is placed (cumulative end of each phrase in the text), matching
 * how the parser derives it. Display order is deterministically scrambled.
 */
export function arrange(
  lang: string,
  lineText: string,
  phrasesInOrder: string[],
): StoryElementArrange {
  const characterPositions: number[] = [];
  let cursor = 0;
  for (const phrase of phrasesInOrder) {
    const start = lineText.indexOf(phrase, cursor);
    if (start === -1) {
      throw new Error(`benchmark fixture: arrange phrase "${phrase}" not in "${lineText}"`);
    }
    cursor = start + phrase.length;
    characterPositions.push(cursor);
  }
  // Deterministic scramble: rotate by 1 and swap the ends.
  const displayOrder = phrasesInOrder.map((_, i) => i);
  displayOrder.push(displayOrder.shift()!);
  if (displayOrder.length > 2) {
    [displayOrder[0], displayOrder[displayOrder.length - 1]] = [
      displayOrder[displayOrder.length - 1],
      displayOrder[0],
    ];
  }
  const selectablePhrases = displayOrder.map((i) => phrasesInOrder[i]);
  // ArrangeQuestion checks `position === phraseOrder[displayIndex]`, so
  // phraseOrder[d] is the correct-order position of the chip shown at d —
  // which is exactly displayOrder (original index == correct position).
  const phraseOrder = displayOrder;
  return {
    type: "ARRANGE",
    lang,
    selectablePhrases,
    phraseOrder,
    characterPositions,
    trackingProperties: { line_index: nextIndex(), challenge_type: "arrange" },
  };
}

const esSelectText = "Quizás están en el bolsillo de mi abrigo.";
const esArrangeText = "Necesito las llaves de mi coche.";
const arSelectText = "ربما هي في جيب معطفي القديم.";
const arArrangeText = "أحتاج مفاتيح سيارتي الآن.";
const jaSelectText = "たぶん古いコートのポケットの中です。";
const jaArrangeText = "私は車の鍵が必要です。";
const teSelectText = "బహుశా అవి నా కోటు జేబులో ఉన్నాయి.";
const teArrangeText = "నాకు నా కారు తాళం చెవులు కావాలి.";

export const EXERCISE_FIXTURES: ExerciseFixture[] = [
  {
    lang: "es",
    rtl: false,
    multipleChoice: mc(
      "es",
      "¿Qué busca Lucía?",
      ["Sus llaves.", "Su teléfono.", "Su pasaporte."],
      0,
    ),
    selectPhraseLine: characterLine("es", spec(esSelectText), {
      hide: "el bolsillo de mi abrigo",
      challengeType: "select-phrases",
    }),
    selectPhrase: selectPhrase(
      "es",
      ["el bolsillo de mi abrigo", "la puerta de mi casa", "el motor de mi coche"],
      0,
    ),
    arrangeLine: characterLine("es", spec(esArrangeText), {
      hide: esArrangeText.replace(/\.$/, ""),
      challengeType: "arrange",
    }),
    arrangePhrases: ["Necesito", "las llaves", "de mi coche"],
    pointToPhrase: pointToPhrase(
      "es",
      'Choose the option that means "coat."',
      [{ sel: "Quizás" }, " están en el ", { sel: "bolsillo" }, " de mi ", { sel: "abrigo" }, "."],
      2,
    ),
    match: match("es", [
      ["la llave", "the key"],
      ["el abrigo", "the coat"],
      ["el bolsillo", "the pocket"],
      ["la mañana", "the morning"],
      ["el coche", "the car"],
    ]),
  },
  {
    lang: "ar",
    rtl: true,
    multipleChoice: mc(
      "ar",
      "عن ماذا تبحث أمينة؟",
      ["عن مفاتيحها.", "عن هاتفها.", "عن جواز سفرها."],
      0,
    ),
    selectPhraseLine: characterLine("ar", spec(arSelectText), {
      hide: "جيب معطفي القديم",
      challengeType: "select-phrases",
    }),
    selectPhrase: selectPhrase(
      "ar",
      ["جيب معطفي القديم", "باب بيتي الكبير", "محرك سيارتي"],
      0,
    ),
    arrangeLine: characterLine("ar", spec(arArrangeText), {
      hide: arArrangeText.replace(/\.$/, ""),
      challengeType: "arrange",
    }),
    arrangePhrases: ["أحتاج", "مفاتيح", "سيارتي", "الآن"],
    pointToPhrase: pointToPhrase(
      "ar",
      'Choose the option that means "pocket."',
      [{ sel: "ربما" }, " هي في ", { sel: "جيب" }, " ", { sel: "معطفي" }, " القديم."],
      1,
    ),
    match: match("ar", [
      ["مفتاح", "key"],
      ["معطف", "coat"],
      ["جيب", "pocket"],
      ["صباح", "morning"],
      ["سيارة", "car"],
    ]),
  },
  {
    lang: "ja",
    rtl: false,
    multipleChoice: mc(
      "ja",
      "ゆきさんは何を探していますか。",
      ["鍵です。", "電話です。", "パスポートです。"],
      0,
    ),
    selectPhraseLine: characterLine("ja", spec(jaSelectText), {
      hide: "コートのポケットの中",
      challengeType: "select-phrases",
    }),
    selectPhrase: selectPhrase(
      "ja",
      ["コートのポケットの中", "テーブルの上", "かばんの中"],
      0,
    ),
    arrangeLine: characterLine("ja", spec(jaArrangeText), {
      hide: jaArrangeText.replace(/。$/, ""),
      challengeType: "arrange",
    }),
    arrangePhrases: ["私は", "車の鍵が", "必要です"],
    pointToPhrase: pointToPhrase(
      "ja",
      'Choose the option that means "pocket."',
      [{ sel: "たぶん" }, "古い", { sel: "コート" }, "の", { sel: "ポケット" }, "の中です。"],
      2,
    ),
    match: match("ja", [
      ["鍵", "key"],
      ["コート", "coat"],
      ["ポケット", "pocket"],
      ["朝", "morning"],
      ["車", "car"],
    ]),
  },
  {
    lang: "te",
    rtl: false,
    multipleChoice: mc(
      "te",
      "ప్రియ దేని కోసం వెతుకుతోంది?",
      ["తాళం చెవుల కోసం.", "ఫోన్ కోసం.", "పుస్తకం కోసం."],
      0,
    ),
    selectPhraseLine: characterLine("te", spec(teSelectText), {
      hide: "కోటు జేబులో",
      challengeType: "select-phrases",
    }),
    selectPhrase: selectPhrase(
      "te",
      ["కోటు జేబులో", "ఇంటి తలుపు దగ్గర", "కారు లోపల"],
      0,
    ),
    arrangeLine: characterLine("te", spec(teArrangeText), {
      hide: teArrangeText.replace(/\.$/, ""),
      challengeType: "arrange",
    }),
    arrangePhrases: ["నాకు", "నా కారు", "తాళం చెవులు", "కావాలి"],
    pointToPhrase: pointToPhrase(
      "te",
      'Choose the option that means "pocket."',
      [{ sel: "బహుశా" }, " అవి నా ", { sel: "కోటు" }, " ", { sel: "జేబులో" }, " ఉన్నాయి."],
      2,
    ),
    match: match("te", [
      ["తాళం", "key"],
      ["కోటు", "coat"],
      ["జేబు", "pocket"],
      ["ఉదయం", "morning"],
      ["కారు", "car"],
    ]),
  },
];

/** Labels for the WordChip status gallery, one row per script. */
export const CHIP_GALLERY: Array<{ lang: string; label: string; word: string }> = [
  { lang: "es", label: "Latin", word: "llaves" },
  { lang: "ar", label: "Arabic", word: "مفاتيح" },
  { lang: "ja", label: "CJK", word: "鍵です" },
  { lang: "te", label: "Telugu", word: "తాళం" },
  { lang: "th", label: "Thai", word: "กุญแจ" },
  { lang: "hi", label: "Devanagari", word: "चाबियाँ" },
];
