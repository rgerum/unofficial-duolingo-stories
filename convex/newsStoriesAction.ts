"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  getGrammarFocus,
  buildGrammarInstruction,
} from "./curriculum/weekResolver";

// ---- Inline bracket → Duolingo format converter ----

function convertInlineLine(rawContent: string): { text: string; hint: string } {
  const segments: Array<{ src: string; hint: string }> = [];
  const regex = /([^[\]]+?)(?:\[([^\]]*)\])/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(rawContent)) !== null) {
    const src = match[1].trim();
    const hint = match[2].trim();
    if (src) segments.push({ src, hint: hint || "_" });
    lastIndex = regex.lastIndex;
  }
  const trailing = rawContent.substring(lastIndex).trim();
  if (trailing) {
    for (const word of trailing.split(/\s+/)) {
      if (word) segments.push({ src: word, hint: "_" });
    }
  }
  const textParts = segments.map((s) => s.src.replace(/\s+/g, "~"));
  const hintParts = segments.map((s) => {
    if (s.hint === "_" || s.hint === "-" || s.hint === "") return "~";
    return s.hint.replace(/\s+/g, "~");
  });
  return { text: textParts.join(" "), hint: hintParts.join(" ") };
}

function convertInlineStory(inlineStory: string): string {
  const lines = inlineStory.split("\n");
  const result: Array<string> = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTextLine = line.startsWith(">") || /^Speaker\d+:/.test(line);
    if (isTextLine && line.includes("[")) {
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

// ---- Prompt builder ----

type LevelConfig = {
  description: string;
  vocabulary: string;
  grammar: string;
  lineCount: string;
  questionCount: string;
  sentenceLength: string;
};

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

const FALLBACK_TOPICS: NewsTopic[] = [
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
  {
    title: "Scientists report progress on renewable energy storage",
    summary:
      "Researchers describe better battery performance and possible effects on clean energy adoption.",
  },
  {
    title: "Global health agencies coordinate new vaccination campaign",
    summary:
      "Officials describe supply planning, regional priorities, and efforts to reach vulnerable communities.",
  },
];

function topicToKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

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
  Group: de la[of the]
  Skip:  María[_]

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

// ---- API helpers ----

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
  const res = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml");
  const xml = await res.text();
  const items = xml.split("<item>");
  const topics: Array<NewsTopic> = [];
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

function ensureTopicPool(topics: NewsTopic[], count: number): NewsTopic[] {
  const deduped: NewsTopic[] = [];
  const seen = new Set<string>();

  for (const topic of [...topics, ...FALLBACK_TOPICS]) {
    const key = topicToKey(topic.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(topic);
    if (deduped.length === count) break;
  }

  return deduped;
}

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
  apiKey: string,
  topic: NewsTopic,
  learningLanguage: string,
  fromLanguage: string,
  level: string,
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
    const result = await callOpenRouter(apiKey, [
      { role: "user", content: prompt },
    ]);
    const usage = normalizeUsage(result.usage);
    const estimatedCostUsd = estimateCostUsd(usage);

    try {
      const parsed = parseJsonObject<StoryPlan>(result.content);
      const plan = validateStoryPlan(topic, parsed);
      return { plan, model: result.model, usage, estimatedCostUsd };
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("Plan validation failed");
      console.warn(
        `[newsStories] Plan attempt ${attempt} failed: ${lastError.message}`,
      );
    }
  }

  throw lastError ?? new Error("Plan generation failed");
}

async function generateValidatedStoryFromPlan(
  apiKey: string,
  topic: NewsTopic,
  plan: StoryPlan,
  learningLanguage: string,
  fromLanguage: string,
  level: string,
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
      `[newsStories] Calling OpenRouter for story attempt ${attempt} (${prompt.length} chars)...`,
    );
    const result = await callOpenRouter(apiKey, [
      { role: "user", content: prompt },
    ]);
    const usage = normalizeUsage(result.usage);
    const estimatedCostUsd = estimateCostUsd(usage);
    accumulatedPromptTokens += usage.prompt_tokens;
    accumulatedCompletionTokens += usage.completion_tokens;
    accumulatedTotalTokens += usage.total_tokens;
    accumulatedCostUsd += estimatedCostUsd;

    console.log(
      `[newsStories] Story attempt ${attempt}: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}, total=${usage.total_tokens}, estCost=$${estimatedCostUsd.toFixed(4)}`,
    );

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
        `[newsStories] Story attempt ${attempt} failed validation: ${lastError.message}`,
      );
    }
  }

  throw lastError ?? new Error("Story generation failed");
}

async function callOpenRouter(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
): Promise<{ content: string; model: string; usage: unknown }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://duostories.org",
      "X-Title": "Duostories News Story Generator",
    },
    body: JSON.stringify({
      model: "anthropic/claude-sonnet-4",
      messages,
      max_tokens: 5000,
      temperature: 0.8,
    }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenRouter API error: ${errorText}`);
  }
  const data = await res.json();
  let content = data.choices?.[0]?.message?.content ?? "";
  content = content.replace(/^```[\s\S]*?\n/, "").replace(/\n```\s*$/, "");
  return { content: content.trim(), model: data.model, usage: data.usage };
}

async function generateTTSAudio(
  apiKey: string,
  voiceId: string,
  text: string,
): Promise<string> {
  const [lang, region] = voiceId.split("-", 2);

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: `${lang}-${region}`, name: voiceId },
        audioConfig: { audioEncoding: "MP3" },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google TTS error: ${errorText}`);
  }

  const { audioContent } = await response.json();
  return audioContent as string; // base64
}

// ---- Language map ----

const LANG_NAMES: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ja: "Japanese",
  ko: "Korean",
  zh: "Mandarin Chinese",
  en: "English",
};

const DEFAULT_VOICES: Record<string, string> = {
  fr: "fr-FR-Neural2-A",
  es: "es-ES-Neural2-A",
  de: "de-DE-Neural2-A",
  it: "it-IT-Neural2-A",
  pt: "pt-BR-Neural2-A",
  nl: "nl-NL-Neural2-A",
  ja: "ja-JP-Neural2-B",
  ko: "ko-KR-Neural2-A",
  zh: "cmn-CN-Neural2-A",
};

// ---- Actions ----

/** Generate a single news story and store it */
export const generateAndStore = internalAction({
  args: {
    language: v.string(),
    fromLanguage: v.string(),
    level: v.string(),
    date: v.optional(v.string()),
    topic: v.optional(v.string()),
    topicKey: v.optional(v.string()),
    topicIndex: v.optional(v.number()),
    topicContext: v.optional(
      v.object({
        title: v.string(),
        summary: v.optional(v.string()),
      }),
    ),
  },
  returns: v.object({
    model: v.string(),
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    estimatedCostUsd: v.number(),
    storyAttemptCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const date = args.date ?? new Date().toISOString().split("T")[0];
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const googleTTSKey = process.env.GOOGLE_TTS_API_KEY;

    if (!openRouterKey)
      throw new Error("OPENROUTER_API_KEY not set in Convex env");

    const learningLanguage = LANG_NAMES[args.language] ?? args.language;
    const fromLanguage = LANG_NAMES[args.fromLanguage] ?? args.fromLanguage;

    console.log(
      `[newsStories] Generating ${args.level} ${learningLanguage} story for ${date}`,
    );

    // 1. Fetch topics
    let topics: Array<NewsTopic>;
    try {
      topics = await fetchNewsTopics();
      console.log(`[newsStories] Got ${topics.length} topics`);
    } catch (e) {
      console.warn("[newsStories] RSS fetch failed, using fallback:", e);
      topics = FALLBACK_TOPICS;
    }

    const topic =
      args.topicContext ??
      (args.topic
        ? topics.find((candidate) => candidate.title === args.topic)
        : undefined) ??
      topics[0];
    if (!topic) {
      throw new Error("No news topic available for story generation");
    }

    // 2. Resolve grammar focus from curriculum
    const grammarFocus = getGrammarFocus(args.language, args.level, date);
    let grammarInstruction: string | null = null;
    if (grammarFocus) {
      grammarInstruction = buildGrammarInstruction(grammarFocus);
      console.log(
        `[newsStories] Grammar focus: week ${grammarFocus.weekNumber}/${grammarFocus.cycleLength}, ` +
          `type=${grammarFocus.week.type}, primary="${grammarFocus.week.primary ?? "review"}"`,
      );
    } else {
      console.log(
        `[newsStories] No curriculum data for ${args.language}/${args.level}, using default grammar`,
      );
    }

    // 3. Generate and validate a grounded story plan first
    const planResult = await generateApprovedPlan(
      openRouterKey,
      topic,
      learningLanguage,
      fromLanguage,
      args.level,
    );
    console.log(
      `[newsStories] Plan approved via ${planResult.model}; prompt=${planResult.usage.prompt_tokens}, completion=${planResult.usage.completion_tokens}, estCost=$${planResult.estimatedCostUsd.toFixed(4)}`,
    );

    // 4. Generate story via OpenRouter from the approved plan
    const { result, storyText, usage, estimatedCostUsd, storyAttemptCount } =
      await generateValidatedStoryFromPlan(
        openRouterKey,
        topic,
        planResult.plan,
        learningLanguage,
        fromLanguage,
        args.level,
        grammarInstruction,
      );
    console.log(
      `[newsStories] Got ${result.content.length} chars from ${result.model}`,
    );
    console.log(
      `[newsStories] Usage: prompt=${usage.prompt_tokens}, completion=${usage.completion_tokens}, total=${usage.total_tokens}, estCost=$${estimatedCostUsd.toFixed(4)}`,
    );
    console.log(`[newsStories] Story attempt count: ${storyAttemptCount}`);

    // 5. Store story in database
    const storyId: Id<"news_stories"> = await ctx.runMutation(
      internal.newsStories.createNewsStory,
      {
        date,
        language: args.language,
        fromLanguage: args.fromLanguage,
        level: args.level,
        topic: topic.title,
        topicKey: args.topicKey ?? topicToKey(topic.title),
        topicIndex: args.topicIndex,
        topicSummary: topic.summary,
        headlines: [topic.title],
        model: result.model,
        storyText,
        rawOutput: result.content,
        // Grammar curriculum metadata
        grammarFocus: grammarFocus?.week.primary ?? undefined,
        grammarMode: grammarFocus?.week.primaryMode ?? undefined,
        grammarWeek: grammarFocus?.weekNumber,
        grammarCycleLength: grammarFocus?.cycleLength,
        secondaryGrammar: grammarFocus?.week.secondary ?? undefined,
        weekType: grammarFocus?.week.type,
      },
    );
    console.log(`[newsStories] Story stored: ${storyId}`);

    await ctx.runMutation(internal.newsStories.logGenerationMetric, {
      scope: "story",
      date,
      language: args.language,
      fromLanguage: args.fromLanguage,
      level: args.level,
      topic: topic.title,
      topicKey: args.topicKey ?? topicToKey(topic.title),
      topicIndex: args.topicIndex,
      newsStoryId: storyId,
      storyCount: 1,
      model: result.model,
      promptTokens: planResult.usage.prompt_tokens + usage.prompt_tokens,
      completionTokens:
        planResult.usage.completion_tokens + usage.completion_tokens,
      totalTokens: planResult.usage.total_tokens + usage.total_tokens,
      estimatedCostUsd: planResult.estimatedCostUsd + estimatedCostUsd,
      storyAttemptCount,
    });

    // 6. Generate audio (if Google TTS key is available)
    if (googleTTSKey) {
      console.log("[newsStories] Generating audio...");
      try {
        await generateAndStoreAudio(
          ctx,
          storyId,
          storyText,
          args.language,
          googleTTSKey,
        );
      } catch (e) {
        console.error("[newsStories] Audio generation failed:", e);
      }
    } else {
      console.log(
        "[newsStories] No GOOGLE_TTS_API_KEY, skipping audio generation",
      );
    }

    console.log(
      `[newsStories] Done: ${args.level} ${learningLanguage} story for ${date}`,
    );
    return {
      model: result.model,
      promptTokens: planResult.usage.prompt_tokens + usage.prompt_tokens,
      completionTokens:
        planResult.usage.completion_tokens + usage.completion_tokens,
      totalTokens: planResult.usage.total_tokens + usage.total_tokens,
      estimatedCostUsd: planResult.estimatedCostUsd + estimatedCostUsd,
      storyAttemptCount,
    };
  },
});

/** Helper: generate audio for story lines and store in Convex file storage */
async function generateAndStoreAudio(
  ctx: {
    storage: { store: (blob: Blob) => Promise<Id<"_storage">> };
    runMutation: (ref: any, args: any) => Promise<any>;
  },
  storyId: Id<"news_stories">,
  storyText: string,
  language: string,
  googleTTSKey: string,
) {
  const voice = DEFAULT_VOICES[language];
  if (!voice) {
    console.warn(`[newsStories] No default voice for language: ${language}`);
    return;
  }

  // Find text lines that need audio.
  // CRITICAL: lineIndex must match trackingProperties.line_index from the parser
  // (syntax_parser_new.ts). The parser's counting rules:
  //   - [HEADER]: hardcoded line_index = 0
  //   - [LINE]: uses counter, then counter += 1
  //   - [MULTIPLE_CHOICE]: uses counter - 1 (shares with previous LINE), NO increment
  //   - [MATCH]: uses counter, then counter += 1
  //   - [SELECT_PHRASE], [ARRANGE], [POINT_TO_PHRASE], [CONTINUATION]: counter += 1
  //   - [DATA]: ignored entirely
  // Counter starts at 1. We only generate audio for text inside [HEADER] and [LINE] blocks.
  const lines = storyText.split("\n");
  type AudioJob = { lineIndex: number; text: string };
  const jobs: Array<AudioJob> = [];
  let counter = 1; // parser starts line_index at 1
  let currentBlock = ""; // track which block type we're inside

  // Blocks that increment the counter (matching parser behavior)
  const INCREMENTING_BLOCKS = new Set([
    "[LINE]",
    "[MATCH]",
    "[SELECT_PHRASE]",
    "[ARRANGE]",
    "[POINT_TO_PHRASE]",
    "[CONTINUATION]",
  ]);
  // [MULTIPLE_CHOICE] does NOT increment — it shares index with previous LINE
  // [HEADER] is special — hardcoded to 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect block markers
    if (line === "[HEADER]") {
      currentBlock = "[HEADER]";
      continue;
    }
    if (line === "[MULTIPLE_CHOICE]") {
      currentBlock = "[MULTIPLE_CHOICE]";
      // NO counter increment — parser uses counter-1 for MULTIPLE_CHOICE
      continue;
    }
    if (INCREMENTING_BLOCKS.has(line)) {
      currentBlock = line;
      counter++;
      continue;
    }
    if (line.startsWith("[") && line.endsWith("]")) {
      // [DATA] or unknown block — skip
      currentBlock = line;
      continue;
    }

    // Skip non-text lines
    if (
      line.startsWith("~") ||
      line.startsWith("#") ||
      line.startsWith("+") ||
      line.startsWith("-") ||
      line === ""
    ) {
      continue;
    }

    // Only generate audio for text inside [HEADER] and [LINE] blocks
    if (currentBlock !== "[HEADER]" && currentBlock !== "[LINE]") continue;

    const isTextLine = line.startsWith(">") || /^Speaker\d+:/.test(line);
    if (!isTextLine) continue;

    let text = line;
    if (text.startsWith(">")) {
      text = text.substring(1).trim();
    } else {
      const colonIdx = text.indexOf(":");
      if (colonIdx >= 0) text = text.substring(colonIdx + 1).trim();
    }
    text = text.replace(/~/g, " ");

    // [HEADER] is hardcoded to line_index 0, [LINE] uses counter-1
    // (counter was already incremented when we saw the block marker)
    const lineIndex = currentBlock === "[HEADER]" ? 0 : counter - 1;

    if (text.trim()) {
      jobs.push({ lineIndex, text });
    }
  }

  console.log(`[newsStories] Generating audio for ${jobs.length} lines`);

  const audioFiles: Array<{ lineIndex: number; storageId: Id<"_storage"> }> =
    [];

  for (let j = 0; j < jobs.length; j++) {
    const job = jobs[j];
    console.log(
      `[newsStories] Audio ${j + 1}/${jobs.length}: "${job.text.substring(0, 40)}..."`,
    );

    try {
      const audioBase64 = await generateTTSAudio(googleTTSKey, voice, job.text);

      const audioBuffer = Buffer.from(audioBase64, "base64");
      const blob = new Blob([audioBuffer], { type: "audio/mpeg" });
      const storageId = await ctx.storage.store(blob);

      audioFiles.push({ lineIndex: job.lineIndex, storageId });
    } catch (e) {
      console.warn(`[newsStories] Audio failed for line ${j}:`, e);
    }
  }

  if (audioFiles.length > 0) {
    await ctx.runMutation(internal.newsStories.addAudioToStory, {
      newsStoryId: storyId,
      audioFiles,
    });
    console.log(`[newsStories] Stored ${audioFiles.length} audio files`);
  }
}

/** Generate 5 topics x 4 levels for a language (called by cron) */
export const generateDailyStories = internalAction({
  args: {
    language: v.string(),
    fromLanguage: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const date = new Date().toISOString().split("T")[0];
    console.log(
      `[newsStories] Starting daily generation for ${args.language} (${date})`,
    );

    let topics: Array<NewsTopic>;
    try {
      topics = await fetchNewsTopics();
      console.log(`[newsStories] Daily topic pool: ${topics.length} topics`);
    } catch (e) {
      console.warn("[newsStories] Daily RSS fetch failed, using fallback:", e);
      topics = FALLBACK_TOPICS;
    }

    const selectedTopics = ensureTopicPool(topics, 5);
    const levels = ["A1", "A2", "B1", "B2"];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let totalEstimatedCostUsd = 0;
    let totalStoryAttempts = 0;
    let lastModelUsed: string | undefined;
    for (const [topicIndex, topicContext] of selectedTopics.entries()) {
      const topicKey = topicToKey(topicContext.title);
      for (const level of levels) {
        try {
          const result: {
            model: string;
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
            estimatedCostUsd: number;
            storyAttemptCount: number;
          } = await ctx.runAction(internal.newsStoriesAction.generateAndStore, {
            language: args.language,
            fromLanguage: args.fromLanguage,
            level,
            date,
            topic: topicContext.title,
            topicKey,
            topicIndex,
            topicContext,
          });
          totalPromptTokens += result.promptTokens;
          totalCompletionTokens += result.completionTokens;
          totalTokens += result.totalTokens;
          totalEstimatedCostUsd += result.estimatedCostUsd;
          totalStoryAttempts += result.storyAttemptCount;
          lastModelUsed = result.model;
        } catch (e) {
          console.error(
            `[newsStories] Failed to generate ${level} story for topic "${topicContext.title}":`,
            e,
          );
        }
      }
    }

    console.log(
      `[newsStories] Daily generation complete for ${args.language}. prompt=${totalPromptTokens}, completion=${totalCompletionTokens}, total=${totalTokens}, estCost=$${totalEstimatedCostUsd.toFixed(4)}, storyAttempts=${totalStoryAttempts}`,
    );
    await ctx.runMutation(internal.newsStories.logGenerationMetric, {
      scope: "batch",
      date,
      language: args.language,
      fromLanguage: args.fromLanguage,
      level: undefined,
      topic: undefined,
      topicKey: undefined,
      topicIndex: undefined,
      newsStoryId: undefined,
      storyCount: selectedTopics.length * levels.length,
      model: lastModelUsed,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens,
      estimatedCostUsd: totalEstimatedCostUsd,
      storyAttemptCount: totalStoryAttempts,
    });
    return null;
  },
});
