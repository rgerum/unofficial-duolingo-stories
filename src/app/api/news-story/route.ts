import { NextResponse } from "next/server";
import {
  getGrammarFocus,
  buildGrammarInstruction,
} from "@/../convex/curriculum/weekResolver";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = "anthropic/claude-sonnet-4";

// Reverse lookup: full language name → short code (for grammar curriculum)
const LANG_SHORT_CODES: Record<string, string> = {
  French: "fr",
  Spanish: "es",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  Dutch: "nl",
  Japanese: "ja",
  Korean: "ko",
  "Mandarin Chinese": "zh",
};

// ---- Inline bracket format → Duolingo format converter ----

/**
 * Converts an inline-bracket annotated line to Duolingo tilde format.
 *
 * Input:  "Es[it's] increíble.[incredible] Las[the] reglas[rules] de la[of] guerra[war] han cambiado[have changed] completamente.[completely]"
 *
 * Output: text = "Es increíble. Las reglas de~la guerra han~cambiado completamente."
 *         hint = "it's incredible the rules of war have~changed completely"
 *
 * Rules:
 *  - `word[translation]`   → word maps to translation
 *  - `multi words[trans]`  → spaces in source become ~, spaces in hint become ~
 *  - `word[_]`             → skip hint (outputs ~ in hint line)
 *  - `word` (no brackets)  → skip hint (outputs ~ in hint line)
 */
function convertInlineLine(rawContent: string): { text: string; hint: string } {
  const segments: { src: string; hint: string }[] = [];

  // Match: text[hint] pairs, or bare text at the end without brackets
  // Pattern: capture text before "[", then hint inside "[]", repeat
  const regex = /([^[\]]+?)(?:\[([^\]]*)\])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(rawContent)) !== null) {
    const src = match[1].trim();
    const hint = match[2].trim();
    if (src) {
      segments.push({ src, hint: hint || "_" });
    }
    lastIndex = regex.lastIndex;
  }

  // Handle any trailing text without brackets (bare words at the end)
  const trailing = rawContent.substring(lastIndex).trim();
  if (trailing) {
    // Split trailing bare words and treat each as skip
    for (const word of trailing.split(/\s+/)) {
      if (word) segments.push({ src: word, hint: "_" });
    }
  }

  // Build Duolingo-format: multi-word segments use ~
  const textParts = segments.map((s) => s.src.replace(/\s+/g, "~"));
  const hintParts = segments.map((s) => {
    if (s.hint === "_" || s.hint === "-" || s.hint === "") return "~";
    return s.hint.replace(/\s+/g, "~");
  });

  return {
    text: textParts.join(" "),
    hint: hintParts.join(" "),
  };
}

/**
 * Converts an entire story from inline-bracket format to Duolingo format.
 *
 * Detects text lines ("> ..." or "Speaker507: ...") that contain "[" brackets,
 * converts them, and generates the corresponding "~" hint line.
 */
function convertInlineStory(inlineStory: string): string {
  const lines = inlineStory.split("\n");
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const isTextLine = line.startsWith(">") || /^Speaker\d+:/.test(line);

    if (isTextLine && line.includes("[")) {
      // Extract speaker prefix
      let prefix = "";
      let textContent = line;
      if (line.startsWith(">")) {
        prefix = "> ";
        textContent = line.substring(1).trim();
      } else {
        const colonIdx = line.indexOf(":");
        if (colonIdx >= 0) {
          prefix = line.substring(0, colonIdx + 1) + " ";
          textContent = line.substring(colonIdx + 1).trim();
        }
      }

      const converted = convertInlineLine(textContent);

      // Reconstruct with proper Duolingo alignment spacing
      const prefixLen = prefix.length;
      const hintPadding = " ".repeat(Math.max(0, prefixLen - 2));

      result.push(prefix + converted.text);
      result.push("~ " + hintPadding + converted.hint);
    } else {
      result.push(line);
    }
  }

  return result.join("\n");
}

// ---- Validation ----

const punctuation_chars =
  "\\/¡!\"'`#$%&*,.:;<=>¿?@^_`{|}…" + "。、，！？；：（）～—·《…》〈…〉﹏……——";
const regex_split_token = new RegExp(
  `([\\s${punctuation_chars}\\]]*(?:^|\\s|$|​|⁠)[\\s${punctuation_chars}]*)`,
);

function splitTextTokens(text: string): string[] {
  if (!text) return [];
  return text.split(regex_split_token);
}

function splitTransTokens(text: string): string[] {
  if (!text) return [];
  return text.split(/([\s​⁠]+)/);
}

type HintMismatch = {
  lineNumber: number;
  textLine: string;
  hintLine: string;
  textTokenCount: number;
  hintTokenCount: number;
};

function validateHintAlignment(storyText: string): HintMismatch[] {
  const lines = storyText.split("\n");
  const mismatches: HintMismatch[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i + 1 >= lines.length) continue;
    const nextLine = lines[i + 1];
    if (!nextLine.startsWith("~")) continue;

    const isTextLine = line.startsWith(">") || /^Speaker\d+:/.test(line);
    if (!isTextLine) continue;

    let textContent = line;
    if (textContent.startsWith(">")) {
      textContent = textContent.substring(1).trim();
    } else {
      const colonIdx = textContent.indexOf(":");
      if (colonIdx >= 0)
        textContent = textContent.substring(colonIdx + 1).trim();
    }

    const hintContent = nextLine.substring(1);

    const textTokens = splitTextTokens(textContent);
    const hintTokens = splitTransTokens(hintContent);

    const textActual = textTokens.filter((t, idx) => idx % 2 === 0 && t !== "");
    const hintActual = hintTokens.filter((t, idx) => idx % 2 === 0 && t !== "");

    if (textActual.length !== hintActual.length) {
      mismatches.push({
        lineNumber: i + 1,
        textLine: line,
        hintLine: nextLine,
        textTokenCount: textActual.length,
        hintTokenCount: hintActual.length,
      });
    }
  }

  return mismatches;
}

// ---- OpenRouter API ----

async function callOpenRouter(
  messages: { role: string; content: string }[],
  model: string = DEFAULT_MODEL,
  maxTokens: number = 4000,
  temperature: number = 0.8,
): Promise<{ content: string; model: string; usage: unknown }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://duostories.org",
      "X-Title": "Duostories News Story Generator",
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  const data = await res.json();
  let content = data.choices?.[0]?.message?.content ?? "";
  content = content.replace(/^```[\s\S]*?\n/, "").replace(/\n```\s*$/, "");
  content = content.trim();

  return { content, model: data.model, usage: data.usage };
}

// ---- News fetching ----

type NewsTopic = {
  title: string;
  summary?: string;
};

type StoryPlan = {
  setting: string;
  situation: string;
  tone: string;
  concreteFacts: string[];
  sourceTermsToMention: string[];
  characters: string[];
  openingHook: string;
  targetVocabulary: string[];
  targetGrammar: string[];
  comprehensionGoals: string[];
  questionPlan: string[];
};

type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

const OPENROUTER_PRICING_USD_PER_MILLION = {
  input: 3,
  output: 15,
} as const;

function normalizeUsage(usage: unknown): Required<OpenRouterUsage> {
  if (!usage || typeof usage !== "object") {
    return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  }

  const candidate = usage as OpenRouterUsage;
  const prompt_tokens = candidate.prompt_tokens ?? 0;
  const completion_tokens = candidate.completion_tokens ?? 0;
  const total_tokens =
    candidate.total_tokens ?? prompt_tokens + completion_tokens;

  return { prompt_tokens, completion_tokens, total_tokens };
}

function estimateCostUsd(usage: Required<OpenRouterUsage>): number {
  return (
    (usage.prompt_tokens / 1_000_000) *
      OPENROUTER_PRICING_USD_PER_MILLION.input +
    (usage.completion_tokens / 1_000_000) *
      OPENROUTER_PRICING_USD_PER_MILLION.output
  );
}

function extractSourceTerms(topic: NewsTopic): string[] {
  const source = [topic.title, topic.summary].filter(Boolean).join(" ");
  const matches = source.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g) ?? [];
  const blacklist = new Set(["Headline", "Summary", "The", "A", "An", "Today"]);
  const unique = new Set<string>();
  for (const match of matches) {
    if (blacklist.has(match)) continue;
    unique.add(match.trim());
  }
  return Array.from(unique).slice(0, 6);
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(item: string, tagName: string): string | undefined {
  const match = item.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`));
  const value = match?.[1]?.trim();
  if (!value) return undefined;
  return (
    decodeXmlEntities(value)
      .replace(/<[^>]+>/g, "")
      .trim() || undefined
  );
}

async function fetchNewsTopics(): Promise<NewsTopic[]> {
  const res = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml", {
    next: { revalidate: 0 },
  });
  const xml = await res.text();
  const items = xml.split("<item>");
  const topics: NewsTopic[] = [];
  for (let i = 1; i < items.length && topics.length < 5; i++) {
    const item = items[i];
    const title = extractTag(item, "title");
    if (!title) continue;
    topics.push({
      title,
      summary: extractTag(item, "description"),
    });
  }
  return topics;
}

// ---- Level configs ----

type LevelConfig = {
  description: string;
  vocabulary: string;
  grammar: string;
  lineCount: string;
  questionCount: string;
  sentenceLength: string;
};

const LEVEL_CONFIGS: Record<string, LevelConfig> = {
  A1: {
    description: "Complete beginner",
    vocabulary:
      "Use only the most basic, high-frequency words (100-500 word range). Stick to concrete nouns, simple verbs (be, have, go, want, like, eat, drink), basic adjectives (big, small, good, bad, new, old), numbers, colors, and common greetings.",
    grammar:
      "Use ONLY present tense. Simple subject-verb-object sentences. No subordinate clauses. No subjunctive or conditional. Avoid idioms entirely.",
    lineCount: "Include 12-16 [LINE] blocks",
    questionCount:
      "Include 2 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 4 pairs",
    sentenceLength:
      "Keep sentences very short (3-6 words). One simple idea per sentence.",
  },
  A2: {
    description: "Elementary",
    vocabulary:
      "Use common everyday vocabulary (500-1500 word range). Include basic verbs in past tense, common expressions, simple connectors (and, but, because, then).",
    grammar:
      "Use present and simple past tense. Allow simple compound sentences with 'and', 'but', 'because'. No complex relative clauses. Keep structures predictable.",
    lineCount: "Include 14-18 [LINE] blocks",
    questionCount:
      "Include 2 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 5 pairs",
    sentenceLength:
      "Sentences can be 4-8 words. Two ideas can be connected with a simple connector.",
  },
  B1: {
    description: "Intermediate",
    vocabulary:
      "Use a solid intermediate vocabulary (1500-3500 word range). Include common idiomatic expressions, phrasal verbs, and topic-specific vocabulary related to the news themes.",
    grammar:
      "Use all common tenses including future and conditional. Allow relative clauses, reported speech, and passive voice. Some complex sentence structures are fine.",
    lineCount: "Include 16-22 [LINE] blocks",
    questionCount:
      "Include 3 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 5 pairs",
    sentenceLength:
      "Sentences can be 5-12 words. Mix simple and compound sentences naturally.",
  },
  B2: {
    description: "Upper intermediate",
    vocabulary:
      "Use rich, nuanced vocabulary (3500-6000 word range). Include less common words, abstract concepts, idiomatic expressions, colloquialisms, and subtle word choices.",
    grammar:
      "Use all tenses freely, including subjunctive and complex conditionals. Use relative clauses, passive constructions, indirect speech, and nuanced connectors (nevertheless, whereas, although).",
    lineCount: "Include 20-26 [LINE] blocks",
    questionCount:
      "Include 3 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 6 pairs",
    sentenceLength:
      "Sentences can be 6-16 words. Use varied sentence structures. Natural conversational flow with interruptions, hesitations, and colloquial phrasing.",
  },
};

// ---- Prompt builder ----

function buildPrompt(
  topic: NewsTopic,
  plan: StoryPlan,
  learningLanguage: string,
  fromLanguage: string,
  level: string,
  grammarInstruction: string | null,
): string {
  const config = LEVEL_CONFIGS[level] ?? LEVEL_CONFIGS["B1"];
  const topicContext = [
    `Headline: ${topic.title}`,
    topic.summary ? `Summary: ${topic.summary}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const grammarSection = grammarInstruction ? `\n${grammarInstruction}\n` : "";

  return `You are a language-learning story writer for Duolingo-style stories.

CEFR LEVEL: ${level} (${config.description})
${config.vocabulary}

LEVEL GRAMMAR CONSTRAINTS:
${config.grammar}
${grammarSection}
${config.sentenceLength}

Given this real news topic from today:
${topicContext}

Write a conversational story in ${learningLanguage} (with ${fromLanguage} translations) inspired by this news topic only. Adapt the complexity to ${level} level.
Focus on a single clear topic. Do not blend in other unrelated headlines or side stories.
Use the summary details when they help, but do not invent specific facts beyond the topic context above.
If the topic context mentions a location, country, or region, name it clearly in the story instead of referring only to vague places like "there" or "the villages".

Use this approved story plan:
- Setting: ${plan.setting}
- Situation: ${plan.situation}
- Tone: ${plan.tone}
- Opening hook: ${plan.openingHook}
- Concrete facts to include:
${plan.concreteFacts.map((fact) => `  - ${fact}`).join("\n")}
- Source terms to mention clearly when natural:
${plan.sourceTermsToMention.map((term) => `  - ${term}`).join("\n")}
- Characters / roles:
${plan.characters.map((character) => `  - ${character}`).join("\n")}
- Target vocabulary to teach and repeat:
${plan.targetVocabulary.map((item) => `  - ${item}`).join("\n")}
- Target grammar to practice:
${plan.targetGrammar.map((item) => `  - ${item}`).join("\n")}
- Comprehension goals:
${plan.comprehensionGoals.map((item) => `  - ${item}`).join("\n")}
- Question plan:
${plan.questionPlan.map((item) => `  - ${item}`).join("\n")}

Keep the story specific. Avoid generic "they are watching the news" filler unless the plan actually calls for it.
Use the target vocabulary multiple times across the story and questions.
Make the comprehension questions test the comprehension goals instead of random details.
Make the [MATCH] pairs come primarily from the target vocabulary.

You MUST use INLINE BRACKET notation for translation hints.
Each word or word-group in the learning language is immediately followed by its ${fromLanguage} translation in square brackets.

Here is a complete example story:

[DATA]
fromLanguageName=Good Morning

[HEADER]
> Buenos días[good morning]

[LINE]
> María[_] está en[is at] casa[home] con[with] su[her] esposo,[husband] Juan.[_]

[LINE]
Speaker507: Hola[hi] María.[_]

[LINE]
Speaker508: Hola,[hi] querido.[darling]

[LINE]
Speaker508: ¿Dónde[where] están[are] mis[my] llaves?[keys]

[MULTIPLE_CHOICE]
> María can't find her keys.
+ Yes, that's right.
- No, that's wrong.

[LINE]
Speaker508: Necesito[I need] ir al[to go to] trabajo.[work]

[LINE]
Speaker507: ¡María![_] Tus[your] llaves[keys] están[are] aquí,[here] ¡en[on] la[the] mesa![table]

[LINE]
> Il y a eu[there has been] une[a] énorme[huge] attaque[attack] de[of] drones.[drones]

[LINE]
Speaker508: No,[no] c'est[it is] l'attaque[the attack] la plus[the most] importante.[important]

[MULTIPLE_CHOICE]
> What is María looking for?
- Her phone
+ Her keys
- Her coffee

[MATCH]
> Tap the pairs
- llaves <> keys
- querido <> darling
- trabajo <> work
- mesa <> table

=== INLINE BRACKET FORMAT RULES ===

Every word or word-group is followed by [translation]:
  Word:  increíble.[incredible]
  Group: de la[of the]    ← multi-word source maps to multi-word translation
  Skip:  María[_]         ← proper names or cognates use [_]

CRITICAL RULES:
1. EVERY word in the learning language MUST have a [bracket] after it. No exceptions.
2. Punctuation stays attached to its word: increíble.[incredible] NOT increíble[incredible].
3. Contractions stay as one unit: c'est[it is]  l'attaque[the attack]  j'ai[I have]
4. Multi-word groups: write them together before one bracket: il y a[there is]  de la[of the]
5. Use [_] for words that don't need translation (names, cognates, interjections).
6. The text inside [...] is the ${fromLanguage} meaning, NOT a phonetic transcription.
7. [MULTIPLE_CHOICE], [MATCH], and [DATA] lines do NOT use bracket notation.

SPEAKER IDS: Use these valid Duolingo character IDs:
- Speaker507, Speaker508, Speaker509 (main characters)
- Speaker592, Speaker593 (secondary characters)
Use ">" for narrator/prose lines.

STRUCTURE RULES:
- Every [LINE] must have a text line with inline bracket hints
- ${config.lineCount}
- ${config.questionCount}
- Spread the [MULTIPLE_CHOICE] blocks throughout the story (not all at the end)
- Put the [MATCH] block at the very end
- The story should feel natural and conversational
- Do NOT include audio lines ($ lines) or pronunciation lines (^ lines)
- Do NOT include [ARRANGE], [SELECT_PHRASE], [POINT_TO_PHRASE], or [CONTINUATION] blocks
- Output ONLY the story text — no explanations, no markdown code fences
`;
}

function buildPlanPrompt(
  topic: NewsTopic,
  learningLanguage: string,
  fromLanguage: string,
  level: string,
): string {
  const sourceTerms = extractSourceTerms(topic);
  const topicContext = [
    `Headline: ${topic.title}`,
    topic.summary ? `Summary: ${topic.summary}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are designing a high-quality Duolingo-style story before writing it.

Target language: ${learningLanguage}
Translation language: ${fromLanguage}
CEFR level: ${level}

Source topic:
${topicContext}

Important source terms to preserve if relevant:
${sourceTerms.map((term) => `- ${term}`).join("\n") || "- none"}

Create a concise JSON plan for a story that feels specific, grounded, and not generic.
The story must avoid vague filler and must include concrete details from the source topic.
If the source topic names a place, country, organization, or person, include it in sourceTermsToMention.

Return ONLY valid JSON with this exact shape:
{
  "setting": "short description of where the story happens",
  "situation": "one sentence summary of the specific situation",
  "tone": "tone descriptor",
  "concreteFacts": ["fact 1", "fact 2", "fact 3"],
  "sourceTermsToMention": ["term 1", "term 2"],
  "characters": ["character 1 role", "character 2 role"],
  "openingHook": "short opening idea",
  "targetVocabulary": ["word or phrase 1", "word or phrase 2", "word or phrase 3", "word or phrase 4", "word or phrase 5"],
  "targetGrammar": ["grammar target 1", "grammar target 2"],
  "comprehensionGoals": ["goal 1", "goal 2"],
  "questionPlan": ["literal comprehension", "vocabulary in context", "inference or grammar-sensitive check"]
}

Requirements:
- concreteFacts must have 3 items
- characters must have 2 or 3 items
- targetVocabulary must have 5 items and should be useful, reusable learner-facing words or phrases
- targetGrammar must have 1 or 2 items appropriate for ${level}
- comprehensionGoals must have 2 items
- questionPlan must have 3 items
- sourceTermsToMention must include at least 1 item when the source topic contains named places, countries, organizations, or people
- Keep everything tightly tied to the source topic
- Do not write the story yet`;
}

function parseJsonObject<T>(raw: string): T {
  const trimmed = raw.trim();
  const cleaned = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new Error("No JSON object found in model output");
  }
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function validateStoryPlan(topic: NewsTopic, plan: StoryPlan): StoryPlan {
  if (!plan.setting?.trim()) throw new Error("Plan missing setting");
  if (!plan.situation?.trim()) throw new Error("Plan missing situation");
  if (!plan.tone?.trim()) throw new Error("Plan missing tone");
  if (!plan.openingHook?.trim()) throw new Error("Plan missing opening hook");
  if (!Array.isArray(plan.concreteFacts) || plan.concreteFacts.length < 3) {
    throw new Error("Plan needs at least 3 concrete facts");
  }
  if (!Array.isArray(plan.characters) || plan.characters.length < 2) {
    throw new Error("Plan needs at least 2 characters");
  }
  if (
    !Array.isArray(plan.targetVocabulary) ||
    plan.targetVocabulary.length < 5
  ) {
    throw new Error("Plan needs 5 target vocabulary items");
  }
  if (
    !Array.isArray(plan.targetGrammar) ||
    plan.targetGrammar.length < 1 ||
    plan.targetGrammar.length > 2
  ) {
    throw new Error("Plan needs 1 or 2 target grammar items");
  }
  if (
    !Array.isArray(plan.comprehensionGoals) ||
    plan.comprehensionGoals.length < 2
  ) {
    throw new Error("Plan needs 2 comprehension goals");
  }
  if (!Array.isArray(plan.questionPlan) || plan.questionPlan.length < 3) {
    throw new Error("Plan needs 3 question plan items");
  }
  if (!Array.isArray(plan.sourceTermsToMention)) {
    throw new Error("Plan sourceTermsToMention must be an array");
  }

  const sourceTerms = extractSourceTerms(topic);
  if (
    sourceTerms.length > 0 &&
    plan.sourceTermsToMention.filter((term) => term.trim().length > 0)
      .length === 0
  ) {
    throw new Error("Plan did not preserve any source terms");
  }

  const combinedFacts = [
    plan.setting,
    plan.situation,
    plan.openingHook,
    ...plan.concreteFacts,
  ]
    .join(" ")
    .toLowerCase();

  if (
    topic.summary &&
    !topic.summary
      .split(/\W+/)
      .filter((word) => word.length > 5)
      .some((word) => combinedFacts.includes(word.toLowerCase()))
  ) {
    throw new Error("Plan facts are too detached from the topic summary");
  }

  return {
    setting: plan.setting.trim(),
    situation: plan.situation.trim(),
    tone: plan.tone.trim(),
    concreteFacts: plan.concreteFacts
      .map((fact) => fact.trim())
      .filter(Boolean),
    sourceTermsToMention: plan.sourceTermsToMention
      .map((term) => term.trim())
      .filter(Boolean),
    characters: plan.characters
      .map((character) => character.trim())
      .filter(Boolean),
    openingHook: plan.openingHook.trim(),
    targetVocabulary: plan.targetVocabulary
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5),
    targetGrammar: plan.targetGrammar
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2),
    comprehensionGoals: plan.comprehensionGoals
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 2),
    questionPlan: plan.questionPlan
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3),
  };
}

function validateStoryAgainstPlan(storyText: string, plan: StoryPlan): void {
  const normalizedStory = storyText.toLowerCase();
  const normalizeVocabItem = (item: string) =>
    item.split(/[(/]/, 1)[0].trim().toLowerCase();

  const missingVocabulary = plan.targetVocabulary.filter((item) => {
    const token = normalizeVocabItem(item);
    return token.length > 0 && !normalizedStory.includes(token);
  });
  if (missingVocabulary.length > 2) {
    throw new Error(
      `Story missed too much target vocabulary: ${missingVocabulary.join(", ")}`,
    );
  }

  const matchTerms = storyText
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.toLowerCase());
  const matchedVocabularyCount = plan.targetVocabulary.filter((item) =>
    matchTerms.some((line) => line.includes(normalizeVocabItem(item))),
  ).length;
  if (matchedVocabularyCount < 2) {
    throw new Error(
      "Match section does not reinforce enough target vocabulary",
    );
  }
}

async function generateApprovedPlan(
  topic: NewsTopic,
  learningLanguage: string,
  fromLanguage: string,
  level: string,
  model: string,
): Promise<{
  plan: StoryPlan;
  model: string;
  usage: Required<OpenRouterUsage>;
  estimatedCostUsd: number;
}> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = buildPlanPrompt(
      topic,
      learningLanguage,
      fromLanguage,
      level,
    );
    const result = await callOpenRouter(
      [{ role: "user", content: prompt }],
      model,
      3000,
      0.4,
    );
    const usage = normalizeUsage(result.usage);
    const estimatedCostUsd = estimateCostUsd(usage);
    try {
      const parsed = parseJsonObject<StoryPlan>(result.content);
      const plan = validateStoryPlan(topic, parsed);
      return { plan, model: result.model ?? model, usage, estimatedCostUsd };
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Plan validation failed");
      console.warn(
        `[news-story] Plan attempt ${attempt} failed: ${lastError.message}`,
      );
    }
  }

  throw lastError ?? new Error("Plan generation failed");
}

async function generateValidatedStoryFromPlan(
  topic: NewsTopic,
  plan: StoryPlan,
  learningLanguage: string,
  fromLanguage: string,
  level: string,
  model: string,
  grammarInstruction: string | null,
): Promise<{
  result: { content: string; model: string; usage: unknown };
  storyText: string;
  usage: Required<OpenRouterUsage>;
  estimatedCostUsd: number;
  storyAttemptCount: number;
}> {
  let lastError: Error | null = null;
  let accumulatedPromptTokens = 0;
  let accumulatedCompletionTokens = 0;
  let accumulatedTotalTokens = 0;
  let accumulatedCostUsd = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const prompt = buildPrompt(
      topic,
      plan,
      learningLanguage,
      fromLanguage,
      level,
      grammarInstruction,
    );
    console.log(
      `[news-story] Generating story attempt ${attempt} (${prompt.length} chars)...`,
    );
    const result = await callOpenRouter(
      [{ role: "user", content: prompt }],
      model,
      5000,
      0.8,
    );
    const usage = normalizeUsage(result.usage);
    const estimatedCostUsd = estimateCostUsd(usage);
    accumulatedPromptTokens += usage.prompt_tokens;
    accumulatedCompletionTokens += usage.completion_tokens;
    accumulatedTotalTokens += usage.total_tokens;
    accumulatedCostUsd += estimatedCostUsd;

    try {
      const storyText = convertInlineStory(result.content);
      validateStoryAgainstPlan(storyText, plan);
      return {
        result,
        storyText,
        usage: {
          prompt_tokens: accumulatedPromptTokens,
          completion_tokens: accumulatedCompletionTokens,
          total_tokens: accumulatedTotalTokens,
        },
        estimatedCostUsd: accumulatedCostUsd,
        storyAttemptCount: attempt,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Story validation after generation failed");
      console.warn(
        `[news-story] Story attempt ${attempt} failed validation: ${lastError.message}`,
      );
    }
  }

  throw lastError ?? new Error("Story generation failed");
}

// ---- POST handler ----

// Disabled in production — only available in preview/development deployments.
export async function POST(request: Request) {
  if (process.env.VERCEL_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is disabled in production" },
      { status: 403 },
    );
  }

  console.log("[news-story] POST request received");

  if (!OPENROUTER_API_KEY) {
    console.error("[news-story] OPENROUTER_API_KEY is not configured!");
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured. Add it to .env.local" },
      { status: 500 },
    );
  }
  console.log("[news-story] API key found");

  const body = await request.json();
  const learningLanguage = body.learningLanguage ?? "Spanish";
  const fromLanguage = body.fromLanguage ?? "English";
  const level = body.level ?? "B1";
  const model = body.model ?? DEFAULT_MODEL;
  console.log(
    `[news-story] Language pair: ${learningLanguage} → ${fromLanguage}, Level: ${level}, Model: ${model}`,
  );

  // Fetch topic context
  let topics: NewsTopic[];
  try {
    console.log("[news-story] Fetching BBC RSS topics...");
    topics = await fetchNewsTopics();
    console.log(
      `[news-story] Got ${topics.length} topics:`,
      topics.map((topic) => topic.title),
    );
  } catch (e) {
    console.warn("[news-story] RSS fetch failed, using fallback topics:", e);
    topics = [
      {
        title: "Global climate summit reaches new agreement",
        summary:
          "World leaders discuss emissions targets, funding, and implementation timelines.",
      },
      {
        title: "Technology companies report record earnings",
        summary:
          "Major firms cite strong demand, AI spending, and improving investor confidence.",
      },
      {
        title: "International space station celebrates anniversary",
        summary:
          "Officials highlight scientific research, international cooperation, and future missions.",
      },
    ];
  }

  const topic = topics[0];
  if (!topic) {
    return NextResponse.json(
      { error: "No news topic available" },
      { status: 500 },
    );
  }

  // Resolve grammar focus from curriculum
  const languageShort = LANG_SHORT_CODES[learningLanguage];
  const today = new Date().toISOString().split("T")[0];
  const grammarFocus = languageShort
    ? getGrammarFocus(languageShort, level, today)
    : null;
  const grammarInstruction = grammarFocus
    ? buildGrammarInstruction(grammarFocus)
    : null;
  if (grammarFocus) {
    console.log(
      `[news-story] Grammar focus: week ${grammarFocus.weekNumber}/${grammarFocus.cycleLength}, ` +
        `type=${grammarFocus.week.type}, primary="${grammarFocus.week.primary ?? "review"}"`,
    );
  }

  const planResult = await generateApprovedPlan(
    topic,
    learningLanguage,
    fromLanguage,
    level,
    model,
  );
  console.log(
    `[news-story] Plan approved via ${planResult.model}; prompt=${planResult.usage.prompt_tokens}, completion=${planResult.usage.completion_tokens}, estCost=$${planResult.estimatedCostUsd.toFixed(4)}`,
  );

  const prompt = buildPrompt(
    topic,
    planResult.plan,
    learningLanguage,
    fromLanguage,
    level,
    grammarInstruction,
  );
  console.log("[news-story] Prompt length:", prompt.length, "chars");
  console.log("[news-story] === FULL PROMPT ===");
  console.log(prompt);
  console.log("[news-story] === END PROMPT ===");

  // Step 1: Generate story in inline bracket format, retrying once if it
  // misses pedagogical or structural criteria.
  console.log(
    "[news-story] Step 1: Generating story (inline bracket format) via OpenRouter...",
  );
  const startTime = Date.now();
  let result;
  let storyText;
  let storyUsage;
  let storyEstimatedCostUsd;
  let storyAttemptCount;
  try {
    ({
      result,
      storyText,
      usage: storyUsage,
      estimatedCostUsd: storyEstimatedCostUsd,
      storyAttemptCount,
    } = await generateValidatedStoryFromPlan(
      topic,
      planResult.plan,
      learningLanguage,
      fromLanguage,
      level,
      model,
      grammarInstruction,
    ));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[news-story] OpenRouter error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
  const genElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `[news-story] Story generated in ${genElapsed}s (${result.content.length} chars)`,
  );
  console.log("[news-story] Model:", result.model);
  const usage = {
    prompt_tokens: planResult.usage.prompt_tokens + storyUsage.prompt_tokens,
    completion_tokens:
      planResult.usage.completion_tokens + storyUsage.completion_tokens,
    total_tokens: planResult.usage.total_tokens + storyUsage.total_tokens,
  };
  const estimatedCostUsd = planResult.estimatedCostUsd + storyEstimatedCostUsd;
  console.log("[news-story] Usage:", usage);
  console.log("[news-story] Estimated cost USD:", estimatedCostUsd.toFixed(4));
  console.log("[news-story] Story attempt count:", storyAttemptCount);
  console.log("[news-story] === RAW LLM OUTPUT ===");
  console.log(result.content);
  console.log("[news-story] === END RAW OUTPUT ===");

  // Step 2: Story conversion already happened inside validated generation.
  console.log(
    "[news-story] Step 2: Converting inline brackets → Duolingo format...",
  );

  // Step 3: Validate final Duolingo format alignment
  const mismatches = validateHintAlignment(storyText);
  console.log(
    `[news-story] Step 3: Final validation: ${mismatches.length} hint mismatches`,
  );
  if (mismatches.length > 0) {
    for (const m of mismatches) {
      console.warn(
        `[news-story]   Line ${m.lineNumber}: text=${m.textTokenCount} tokens, hint=${m.hintTokenCount} tokens`,
      );
      console.warn(`[news-story]     Text: ${m.textLine}`);
      console.warn(`[news-story]     Hint: ${m.hintLine}`);
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[news-story] Total time: ${totalElapsed}s`);
  console.log("[news-story] === CONVERTED OUTPUT ===");
  console.log(storyText);
  console.log("[news-story] === END CONVERTED ===");

  return NextResponse.json({
    storyText,
    headlines: topics.map((item) => item.title),
    topic,
    prompt,
    model: result.model ?? model,
    usage,
    estimatedCostUsd,
    storyAttemptCount,
    hintMismatches: mismatches.length,
  });
}
