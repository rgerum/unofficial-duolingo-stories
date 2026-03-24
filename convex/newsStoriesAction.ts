"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

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
  headlines: string[],
  learningLanguage: string,
  fromLanguage: string,
  level: string,
): string {
  const config = LEVEL_CONFIGS[level] ?? LEVEL_CONFIGS["B1"];

  return `You are a language-learning story writer for Duolingo-style stories.

CEFR LEVEL: ${level} (${config.description})
${config.vocabulary}
${config.grammar}
${config.sentenceLength}

Given these real news headlines from today:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Write a conversational story in ${learningLanguage} (with ${fromLanguage} translations) inspired by one or more of these headlines. Adapt the complexity to ${level} level.

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

async function fetchNewsHeadlines(): Promise<string[]> {
  const res = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml");
  const xml = await res.text();
  const items = xml.split("<item>");
  const headlines: Array<string> = [];
  for (let i = 1; i < items.length && headlines.length < 5; i++) {
    const titleMatch = items[i].match(/<title><!\[CDATA\[(.*?)\]\]>/);
    const titleMatch2 = items[i].match(/<title>(.*?)<\/title>/);
    const title = titleMatch?.[1] ?? titleMatch2?.[1];
    if (title) headlines.push(title);
  }
  return headlines;
}

async function callOpenRouter(
  apiKey: string,
  messages: Array<{ role: string; content: string }>,
): Promise<{ content: string; model: string }> {
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
  return { content: content.trim(), model: data.model };
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
  },
  returns: v.null(),
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

    // 1. Fetch headlines
    let headlines: Array<string>;
    try {
      headlines = await fetchNewsHeadlines();
      console.log(`[newsStories] Got ${headlines.length} headlines`);
    } catch (e) {
      console.warn("[newsStories] RSS fetch failed, using fallback:", e);
      headlines = [
        "Global climate summit reaches new agreement",
        "Technology companies report record earnings",
        "International space station celebrates anniversary",
      ];
    }

    // 2. Generate story via OpenRouter
    const prompt = buildPrompt(
      headlines,
      learningLanguage,
      fromLanguage,
      args.level,
    );
    console.log(`[newsStories] Calling OpenRouter (${prompt.length} chars)...`);

    const result = await callOpenRouter(openRouterKey, [
      { role: "user", content: prompt },
    ]);
    console.log(
      `[newsStories] Got ${result.content.length} chars from ${result.model}`,
    );

    // 3. Convert to Duolingo format
    const storyText = convertInlineStory(result.content);

    // 4. Store story in database
    const storyId: Id<"news_stories"> = await ctx.runMutation(
      internal.newsStories.createNewsStory,
      {
        date,
        language: args.language,
        fromLanguage: args.fromLanguage,
        level: args.level,
        headlines,
        model: result.model,
        storyText,
        rawOutput: result.content,
      },
    );
    console.log(`[newsStories] Story stored: ${storyId}`);

    // 5. Generate audio (if Google TTS key is available)
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
    return null;
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

/** Generate all 4 levels for a language (called by cron) */
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

    const levels = ["A1", "A2", "B1", "B2"];
    for (const level of levels) {
      try {
        await ctx.runAction(internal.newsStoriesAction.generateAndStore, {
          language: args.language,
          fromLanguage: args.fromLanguage,
          level,
          date,
        });
      } catch (e) {
        console.error(`[newsStories] Failed to generate ${level} story:`, e);
      }
    }

    console.log(`[newsStories] Daily generation complete for ${args.language}`);
    return null;
  },
});
