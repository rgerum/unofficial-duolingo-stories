import { NextResponse } from "next/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

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
      // Debug: keep original inline line as comment
      result.push("# INLINE: " + line);
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
      if (colonIdx >= 0) textContent = textContent.substring(colonIdx + 1).trim();
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
      model: "anthropic/claude-sonnet-4",
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

async function fetchNewsHeadlines(): Promise<string[]> {
  const res = await fetch("https://feeds.bbci.co.uk/news/world/rss.xml", {
    next: { revalidate: 0 },
  });
  const xml = await res.text();
  const items = xml.split("<item>");
  const headlines: string[] = [];
  for (let i = 1; i < items.length && headlines.length < 5; i++) {
    const titleMatch = items[i].match(/<title><!\[CDATA\[(.*?)\]\]>/);
    const titleMatch2 = items[i].match(/<title>(.*?)<\/title>/);
    const title = titleMatch?.[1] ?? titleMatch2?.[1];
    if (title) headlines.push(title);
  }
  return headlines;
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
    vocabulary: "Use only the most basic, high-frequency words (100-500 word range). Stick to concrete nouns, simple verbs (be, have, go, want, like, eat, drink), basic adjectives (big, small, good, bad, new, old), numbers, colors, and common greetings.",
    grammar: "Use ONLY present tense. Simple subject-verb-object sentences. No subordinate clauses. No subjunctive or conditional. Avoid idioms entirely.",
    lineCount: "Include 12-16 [LINE] blocks",
    questionCount: "Include 2 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 4 pairs",
    sentenceLength: "Keep sentences very short (3-6 words). One simple idea per sentence.",
  },
  A2: {
    description: "Elementary",
    vocabulary: "Use common everyday vocabulary (500-1500 word range). Include basic verbs in past tense, common expressions, simple connectors (and, but, because, then).",
    grammar: "Use present and simple past tense. Allow simple compound sentences with 'and', 'but', 'because'. No complex relative clauses. Keep structures predictable.",
    lineCount: "Include 14-18 [LINE] blocks",
    questionCount: "Include 2 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 5 pairs",
    sentenceLength: "Sentences can be 4-8 words. Two ideas can be connected with a simple connector.",
  },
  B1: {
    description: "Intermediate",
    vocabulary: "Use a solid intermediate vocabulary (1500-3500 word range). Include common idiomatic expressions, phrasal verbs, and topic-specific vocabulary related to the news themes.",
    grammar: "Use all common tenses including future and conditional. Allow relative clauses, reported speech, and passive voice. Some complex sentence structures are fine.",
    lineCount: "Include 16-22 [LINE] blocks",
    questionCount: "Include 3 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 5 pairs",
    sentenceLength: "Sentences can be 5-12 words. Mix simple and compound sentences naturally.",
  },
  B2: {
    description: "Upper intermediate",
    vocabulary: "Use rich, nuanced vocabulary (3500-6000 word range). Include less common words, abstract concepts, idiomatic expressions, colloquialisms, and subtle word choices.",
    grammar: "Use all tenses freely, including subjunctive and complex conditionals. Use relative clauses, passive constructions, indirect speech, and nuanced connectors (nevertheless, whereas, although).",
    lineCount: "Include 20-26 [LINE] blocks",
    questionCount: "Include 3 [MULTIPLE_CHOICE] blocks and 1 [MATCH] block with 6 pairs",
    sentenceLength: "Sentences can be 6-16 words. Use varied sentence structures. Natural conversational flow with interruptions, hesitations, and colloquial phrasing.",
  },
};

// ---- Prompt builder ----

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

// ---- POST handler ----

export async function POST(request: Request) {
  console.log("[news-story] POST request received");

  if (!OPENROUTER_API_KEY) {
    console.error("[news-story] OPENROUTER_API_KEY is not configured!");
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured. Add it to .env.local" },
      { status: 500 },
    );
  }
  console.log("[news-story] API key found (starts with:", OPENROUTER_API_KEY.substring(0, 8) + "...)");

  const body = await request.json();
  const learningLanguage = body.learningLanguage ?? "Spanish";
  const fromLanguage = body.fromLanguage ?? "English";
  const level = body.level ?? "B1";
  console.log(`[news-story] Language pair: ${learningLanguage} → ${fromLanguage}, Level: ${level}`);

  // Fetch headlines
  let headlines: string[];
  try {
    console.log("[news-story] Fetching BBC RSS headlines...");
    headlines = await fetchNewsHeadlines();
    console.log(`[news-story] Got ${headlines.length} headlines:`, headlines);
  } catch (e) {
    console.warn("[news-story] RSS fetch failed, using fallback headlines:", e);
    headlines = [
      "Global climate summit reaches new agreement",
      "Technology companies report record earnings",
      "International space station celebrates anniversary",
    ];
  }

  const prompt = buildPrompt(headlines, learningLanguage, fromLanguage, level);
  console.log("[news-story] Prompt length:", prompt.length, "chars");
  console.log("[news-story] === FULL PROMPT ===");
  console.log(prompt);
  console.log("[news-story] === END PROMPT ===");

  // Step 1: Generate story in inline bracket format
  console.log("[news-story] Step 1: Generating story (inline bracket format) via OpenRouter...");
  const startTime = Date.now();
  let result;
  try {
    result = await callOpenRouter(
      [{ role: "user", content: prompt }],
      5000,
      0.8,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[news-story] OpenRouter error:", msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
  const genElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[news-story] Story generated in ${genElapsed}s (${result.content.length} chars)`);
  console.log("[news-story] Model:", result.model);
  console.log("[news-story] Usage:", result.usage);
  console.log("[news-story] === RAW LLM OUTPUT ===");
  console.log(result.content);
  console.log("[news-story] === END RAW OUTPUT ===");

  // Step 2: Convert inline bracket format → Duolingo tilde format
  console.log("[news-story] Step 2: Converting inline brackets → Duolingo format...");
  const storyText = convertInlineStory(result.content);

  // Step 3: Validate final Duolingo format alignment
  const mismatches = validateHintAlignment(storyText);
  console.log(`[news-story] Step 3: Final validation: ${mismatches.length} hint mismatches`);
  if (mismatches.length > 0) {
    for (const m of mismatches) {
      console.warn(`[news-story]   Line ${m.lineNumber}: text=${m.textTokenCount} tokens, hint=${m.hintTokenCount} tokens`);
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
    headlines,
    model: result.model,
    hintMismatches: mismatches.length,
  });
}
