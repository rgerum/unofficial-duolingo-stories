import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { api } from "../convex/_generated/api";

const CODEX_CLI_PACKAGE = "@openai/codex@0.150.1";
const REVIEW_ENDPOINT_TIMEOUT_MS = 30_000;

type Confidence = "high" | "medium" | "low";

type StoryIssueLinkMatch = {
  matchFound: boolean;
  confidence: Confidence;
  storyId: number | null;
  courseShort: string | null;
  storyTitle: string | null;
  editorLine: number | null;
  editorLines: number[];
  editorLink: string | null;
  editorLinks: string[];
  storyLink: string | null;
  storyLinks: string[];
  storyFile: string | null;
  issueSummary: string;
  evidence: string[];
  notes: string;
  draftMessage: string;
};

function buildDeterministicDraftMessage(args: {
  storyTitle: string | null;
  courseShort: string | null;
  storyId: number | null;
  editorLine: number | null;
  editorLines: number[];
  editorLink: string | null;
  editorLinks: string[];
  storyLink: string | null;
  storyLinks: string[];
}) {
  const storyLabel = args.storyTitle ?? "Unknown";
  const courseLabel = args.courseShort ?? "unknown";
  const storyIdLabel = args.storyId !== null ? String(args.storyId) : "unknown";
  const lineLabel =
    args.editorLines.length > 1
      ? args.editorLines.join(", ")
      : args.editorLine !== null
        ? String(args.editorLine)
        : "unclear";
  const note =
    args.editorLines.length > 1
      ? "Multiple relevant lines were mentioned explicitly."
      : args.editorLine !== null
        ? "Most likely spot; may be a nearby line in the same scene."
        : "Story match looks good, but the exact line is unclear.";

  const lines = [
    `Possible story: ${storyLabel} [${courseLabel}, id ${storyIdLabel}, ${args.editorLines.length > 1 ? `lines ${lineLabel}` : `line ${lineLabel}`}]`,
  ];

  if (args.editorLinks.length > 1) {
    lines.push("Editor links:");
    lines.push(...args.editorLinks.map((link) => `  - ${link}`));
  } else {
    lines.push(`Editor link: ${args.editorLink ?? "none"}`);
  }

  if (args.storyLinks.length > 1) {
    lines.push("Story links:");
    lines.push(...args.storyLinks.map((link) => `  - ${link}`));
  } else {
    lines.push(`Story link: ${args.storyLink ?? "none"}`);
  }

  lines.push(`Note: ${note}`);
  return lines.join("\n");
}

type CourseSummary = {
  id: number;
  short: string | null;
  learning_language_name: string;
  learning_language_short: string;
  from_language_name: string;
  from_language_short: string;
  count: number;
  public: boolean;
};

type StorySummary = {
  id: number;
  name: string;
  course_id: number;
  set_id: number;
  set_index: number;
  public: boolean;
};

type CandidateCourse = CourseSummary & {
  score: number;
  reasons: string[];
};

type ReviewCourseSummary = {
  short: string;
  name: string;
  learningLanguage: string;
  learningLanguageShort: string;
};

type ReviewStorySummary = {
  storyId: number;
  id?: number;
  name: string;
  status: string;
  approvalCount: number;
  setId: number;
  setIndex: number;
  text: string;
  courseShort: string;
  courseTags: string[];
  learningLanguageShort: string;
  learningLanguageLegacyId: number;
  fromLanguageShort: string;
};

type CandidateStory = StorySummary & {
  courseShort: string | null;
  learningLanguageName: string;
  fromLanguageName: string;
  score: number;
  reasons: string[];
};

type CandidateStoryDocument = {
  storyId: number;
  courseShort: string | null;
  storyTitle: string;
  score: number;
  numberedDocument: string;
};

type CliArgs = {
  title: string;
  body: string;
  hint: string;
  context: string;
  model: string | null;
  cwd: string;
  raw: boolean;
};

function parseArgs(argv: string[]): CliArgs {
  let title = "";
  let body = "";
  let hint = "";
  let context = "";
  let model: string | null = null;
  let cwd = process.cwd();
  let raw = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--") {
      continue;
    }

    if (arg === "--title") {
      if (!next) throw new Error("--title requires a value");
      title = next;
      index += 1;
      continue;
    }
    if (arg === "--body") {
      if (!next) throw new Error("--body requires a value");
      body = next;
      index += 1;
      continue;
    }
    if (arg === "--context") {
      if (!next) throw new Error("--context requires a value");
      context = next;
      index += 1;
      continue;
    }
    if (arg === "--hint") {
      if (!next) throw new Error("--hint requires a value");
      hint = next;
      index += 1;
      continue;
    }
    if (arg === "--model") {
      if (!next) throw new Error("--model requires a value");
      model = next;
      index += 1;
      continue;
    }
    if (arg === "--cwd") {
      if (!next) throw new Error("--cwd requires a value");
      cwd = resolve(next);
      index += 1;
      continue;
    }
    if (arg === "--raw") {
      raw = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    title: title.trim(),
    body: body.trim(),
    hint: hint.trim(),
    context: context.trim(),
    model,
    cwd,
    raw,
  };
}

function printHelp() {
  console.log(`Usage:
  pnpm exec tsx scripts/find-story-link-with-codex.ts --title "..." [--body "..."]
  cat issue.txt | pnpm exec tsx scripts/find-story-link-with-codex.ts --title "..."

Options:
  --title   Issue/thread title
  --body    Issue/thread body; if omitted, stdin is used
  --hint    Optional operator-provided course/language hint
  --context Additional same-author/history context for ambiguous reports
  --model   Optional model name passed to codex exec
  --cwd     Workspace root for codex exec (defaults to current directory)
  --raw     Print Codex's raw final JSON string instead of pretty JSON
`);
}

async function readStdin() {
  if (process.stdin.isTTY) return "";

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  return Buffer.concat(chunks).toString("utf8").trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function extractLanguageHint(title: string) {
  const match = title.match(/\(([^()]+)\)\s*$/);
  return match ? match[1].trim() : "";
}

function extractParenthesizedLanguageHints(value: string) {
  return unique(
    [...value.matchAll(/\(([^()]+)\)/g)]
      .map((match) => match[1]?.trim())
      .filter((hint): hint is string => Boolean(hint)),
  );
}

function extractBodyLanguageHints(body: string) {
  const hints = [
    ...body.matchAll(/\bin\s+(?:all\s+(?:the\s+)?)?([a-z][a-z -]+?)\s+stories\b/gi),
    ...body.matchAll(/\bin\s+([a-z][a-z -]+?)\s+(?:in\s+)?duostories\b/gi),
  ];

  return unique(
    hints
      .map((match) => match[1]?.trim())
      .filter((hint): hint is string => Boolean(hint)),
  );
}

function extractSetHint(title: string) {
  const match = title.match(/\bset\s+(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

function stripTitleHints(title: string) {
  return title
    .replace(/\(([^()]+)\)\s*$/g, "")
    .replace(/\bset\s+\d+\s*:\s*/gi, "")
    .trim();
}

function overlapScore(needles: string[], haystack: string[]) {
  if (needles.length === 0 || haystack.length === 0) return 0;
  const haystackSet = new Set(haystack);
  let matches = 0;
  for (const token of needles) {
    if (haystackSet.has(token)) matches += 1;
  }
  return matches;
}

function buildCourseSearchStrings(course: CourseSummary) {
  return unique([
    course.short ?? "",
    course.learning_language_name,
    course.learning_language_short,
    course.from_language_name,
    course.from_language_short,
    `${course.learning_language_name} ${course.from_language_name}`,
    `${course.learning_language_short} ${course.from_language_short}`,
  ]).filter(Boolean);
}

function scoreCourse(
  course: CourseSummary,
  title: string,
  body: string,
  hint: string,
  context: string,
): CandidateCourse {
  const reasons: string[] = [];
  let score = 0;

  const languageHint = normalizeText(extractLanguageHint(title));
  const manualHints = unique([
    hint,
    ...extractParenthesizedLanguageHints(hint),
    ...extractBodyLanguageHints(hint),
  ].filter(Boolean));
  const bodyLanguageHints = extractBodyLanguageHints(body);
  const contextLanguageHints = [
    ...extractParenthesizedLanguageHints(context),
    ...extractBodyLanguageHints(context),
  ];
  const titleTokens = tokenize(title);
  const courseStrings = buildCourseSearchStrings(course);
  const courseTokens = tokenize(courseStrings.join(" "));

  if (languageHint) {
    const languageMatches = courseStrings.filter((value) =>
      normalizeText(value).includes(languageHint),
    );
    if (languageMatches.length > 0) {
      score += 100;
      reasons.push(`language_hint=${extractLanguageHint(title)}`);
    }
  }

  for (const manualHint of manualHints) {
    const normalizedManualHint = normalizeText(manualHint);
    if (!normalizedManualHint) continue;
    const languageMatches = courseStrings.filter((value) =>
      normalizeText(value).includes(normalizedManualHint),
    );
    if (languageMatches.length > 0) {
      score += 120;
      reasons.push(`manual_hint=${manualHint}`);
    }
  }

  for (const bodyLanguageHint of bodyLanguageHints) {
    const normalizedBodyLanguageHint = normalizeText(bodyLanguageHint);
    if (!normalizedBodyLanguageHint) continue;
    const languageMatches = courseStrings.filter((value) =>
      normalizeText(value).includes(normalizedBodyLanguageHint),
    );
    if (languageMatches.length > 0) {
      score += 100;
      reasons.push(`body_language_hint=${bodyLanguageHint}`);
    }
  }

  for (const contextLanguageHint of contextLanguageHints) {
    const normalizedContextLanguageHint = normalizeText(contextLanguageHint);
    if (!normalizedContextLanguageHint) continue;
    const languageMatches = courseStrings.filter((value) =>
      normalizeText(value).includes(normalizedContextLanguageHint),
    );
    if (languageMatches.length > 0) {
      score += 40;
      reasons.push(`context_language_hint=${contextLanguageHint}`);
    }
  }

  const tokenMatches = overlapScore(titleTokens, courseTokens);
  if (tokenMatches > 0) {
    score += tokenMatches * 8;
    reasons.push(`title_course_token_overlap=${tokenMatches}`);
  }

  if (score > 0 && course.public) {
    score += 2;
    reasons.push("public_course");
  }

  return { ...course, score, reasons };
}

function scoreStory(
  story: StorySummary,
  course: CourseSummary,
  title: string,
  body: string,
): CandidateStory {
  const reasons: string[] = [];
  let score = 0;

  const setHint = extractSetHint(title);
  const strippedTitle = stripTitleHints(title);
  const titleTokens = tokenize(strippedTitle);
  const bodyTokens = tokenize(body);
  const storyTokens = tokenize(story.name);

  if (setHint !== null && story.set_id === setHint) {
    score += 80;
    reasons.push(`set_id=${setHint}`);
  }

  const titleMatches = overlapScore(titleTokens, storyTokens);
  if (titleMatches > 0) {
    score += titleMatches * 15;
    reasons.push(`title_story_token_overlap=${titleMatches}`);
  }

  const bodyMatches = overlapScore(bodyTokens, storyTokens);
  if (bodyMatches > 0) {
    score += bodyMatches * 4;
    reasons.push(`body_story_token_overlap=${bodyMatches}`);
  }

  if (normalizeText(story.name) === normalizeText(strippedTitle)) {
    score += 120;
    reasons.push("exact_normalized_title_match");
  }

  if (story.public) {
    score += 2;
    reasons.push("public_story");
  }

  return {
    ...story,
    courseShort: course.short,
    learningLanguageName: course.learning_language_name,
    fromLanguageName: course.from_language_name,
    score,
    reasons,
  };
}

function formatCandidates(courses: CandidateCourse[], stories: CandidateStory[]) {
  const courseLines =
    courses.length === 0
      ? ["- none"]
      : courses.map(
          (course) =>
            `- course_id=${course.id} short=${course.short ?? "null"} learning=${JSON.stringify(course.learning_language_name)} from=${JSON.stringify(course.from_language_name)} score=${course.score} reasons=${course.reasons.join(",")}`,
        );

  const storyLines =
    stories.length === 0
      ? ["- none"]
      : stories.map(
          (story) =>
            `- story_id=${story.id} course_short=${story.courseShort ?? "null"} set=${story.set_id} index=${story.set_index} title=${JSON.stringify(story.name)} score=${story.score} reasons=${story.reasons.join(",")}`,
        );

  return {
    courseLines,
    storyLines,
  };
}

function numberDocumentLines(text: string, maxLines = 220) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  return lines
    .slice(0, maxLines)
    .map((line, index) => `${index + 1}: ${line}`)
    .join("\n");
}

async function buildConvexClient(cwd: string) {
  dotenv.config({ path: resolve(cwd, ".env.local"), quiet: true });
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
  if (!convexUrl) return null;
  return new ConvexHttpClient(convexUrl);
}

async function postReviewEndpoint<T>(
  body: Record<string, unknown>,
): Promise<T | null> {
  const reviewUrl =
    process.env.DISCORD_REVIEW_URL ||
    process.env.CONVEX_REVIEW_URL ||
    process.env.CONVEX_DISCORD_REVIEW_URL;
  const secret = process.env.DISCORD_REVIEW_SECRET;
  if (!reviewUrl || !secret) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REVIEW_ENDPOINT_TIMEOUT_MS);
  const response = await fetch(reviewUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, ...body }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    throw new Error(`Discord review endpoint returned HTTP ${response.status}`);
  }
  const json = (await response.json()) as { ok?: boolean; error?: string } & T;
  if (json.ok !== true) {
    throw new Error(json.error ?? "Discord review endpoint returned ok=false");
  }
  return json;
}

function reviewCourseToCourseSummary(course: ReviewCourseSummary): CourseSummary {
  const [learningShort = "", fromShort = ""] = course.short.split("-");
  const fromMatch = course.name.match(/\bfrom\s+(.+)$/i);
  return {
    id: 0,
    short: course.short,
    learning_language_name: course.learningLanguage,
    learning_language_short: course.learningLanguageShort || learningShort,
    from_language_name: fromMatch?.[1] ?? "",
    from_language_short: fromShort,
    count: 0,
    public: true,
  };
}

function reviewStoryToStorySummary(story: ReviewStorySummary): StorySummary {
  return {
    id: story.storyId ?? story.id,
    name: story.name,
    course_id: 0,
    set_id: story.setId,
    set_index: story.setIndex,
    public: story.status === "public",
  };
}

async function getCandidateContextFromReviewEndpoint(
  title: string,
  body: string,
  hint: string,
  context: string,
): Promise<{
  courses: CandidateCourse[];
  stories: CandidateStory[];
  documents: CandidateStoryDocument[];
} | null> {
  const coursePayload = await postReviewEndpoint<{ courses: ReviewCourseSummary[] }>({
    listCourses: true,
  });
  if (!coursePayload) return null;

  const courses = coursePayload.courses
    .map(reviewCourseToCourseSummary)
    .map((course) => scoreCourse(course, title, body, hint, context))
    .filter((course) => course.score > 0)
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 5);

  const setHint = extractSetHint(title);
  const storyCandidates: CandidateStory[] = [];
  const storyTexts = new Map<number, string>();
  for (const course of courses) {
    if (!course.short) continue;
    const storyPayload = await postReviewEndpoint<{
      stories: ReviewStorySummary[];
    }>({
      courseShort: course.short,
      sets: setHint !== null ? [setHint] : [],
    });
    if (!storyPayload) continue;

    for (const reviewStory of storyPayload.stories) {
      const story = reviewStoryToStorySummary(reviewStory);
      storyTexts.set(story.id, reviewStory.text);
      const candidate = scoreStory(story, course, title, body);
      if (candidate.score <= 0) continue;
      storyCandidates.push(candidate);
    }
  }

  storyCandidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.set_id - b.set_id ||
      a.set_index - b.set_index ||
      a.id - b.id,
  );

  const documents = storyCandidates.slice(0, 4).flatMap((story) => {
    const text = storyTexts.get(story.id);
    if (!text) return [];
    return [
      {
        storyId: story.id,
        courseShort: story.courseShort,
        storyTitle: story.name,
        score: story.score,
        numberedDocument: numberDocumentLines(text),
      },
    ];
  });

  return {
    courses,
    stories: storyCandidates.slice(0, 15),
    documents,
  };
}

async function getCandidateContextFromPublicQueries(
  client: ConvexHttpClient,
  title: string,
  body: string,
  hint: string,
  context: string,
): Promise<{
  courses: CandidateCourse[];
  stories: CandidateStory[];
  documents: CandidateStoryDocument[];
}> {
  const publicCourses = (await client.query(
    api.landing.getPublicCourseList,
    {},
  )) as unknown as CourseSummary[];
  const courses = publicCourses
    .map((course) => scoreCourse(course, title, body, hint, context))
    .filter((course) => course.score > 0)
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 5);

  const storyCandidates: CandidateStory[] = [];
  for (const course of courses) {
    if (!course.short) continue;
    const coursePage = (await client.query(api.landing.getPublicCoursePageData, {
      short: course.short,
    })) as { stories?: StorySummary[] } | null;

    for (const story of coursePage?.stories ?? []) {
      const candidate = scoreStory(story, course, title, body);
      if (candidate.score <= 0) continue;
      storyCandidates.push(candidate);
    }
  }

  storyCandidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.set_id - b.set_id ||
      a.set_index - b.set_index ||
      a.id - b.id,
  );

  return {
    courses,
    stories: storyCandidates.slice(0, 15),
    documents: [],
  };
}

async function getCandidateContext(
  cwd: string,
  title: string,
  body: string,
  hint: string,
  context: string,
): Promise<{
  courses: CandidateCourse[];
  stories: CandidateStory[];
  documents: CandidateStoryDocument[];
}> {
  dotenv.config({ path: resolve(cwd, ".env.local"), quiet: true });
  const reviewEndpointContext = await getCandidateContextFromReviewEndpoint(
    title,
    body,
    hint,
    context,
  ).catch(() => null);
  if (reviewEndpointContext) return reviewEndpointContext;

  const client = await buildConvexClient(cwd);
  if (!client) {
    return { courses: [], stories: [], documents: [] };
  }

  const publicQueryContext = await getCandidateContextFromPublicQueries(
    client,
    title,
    body,
    hint,
    context,
  );
  if (publicQueryContext.stories.length > 0) return publicQueryContext;

  const sidebar = await client.query(api.editorRead.getEditorSidebarData, {});
  const courses = ((sidebar?.courses ?? []) as CourseSummary[])
    .map((course) => scoreCourse(course, title, body, hint, context))
    .filter((course) => course.score > 0)
    .sort((a, b) => b.score - a.score || b.count - a.count)
    .slice(0, 5);

  const storyCandidates: CandidateStory[] = [];
  for (const course of courses) {
    const identifier = course.short ?? String(course.id);
    const stories = (await client.query(
      api.editorRead.getEditorStoriesByCourseLegacyId,
      { identifier },
    )) as StorySummary[];

    for (const story of stories) {
      const candidate = scoreStory(story, course, title, body);
      if (candidate.score <= 0) continue;
      storyCandidates.push(candidate);
    }
  }

  storyCandidates.sort(
    (a, b) =>
      b.score - a.score ||
      a.set_id - b.set_id ||
      a.set_index - b.set_index ||
      a.id - b.id,
  );

  const topStories = storyCandidates.slice(0, 4);
  const documents: CandidateStoryDocument[] = [];
  for (const story of topStories) {
    const detail = await client.query(api.editorRead.getEditorStoryPageData, {
      storyId: story.id,
    });
    const text = detail?.story_data?.text;
    if (typeof text !== "string" || text.length === 0) continue;
    documents.push({
      storyId: story.id,
      courseShort: story.courseShort,
      storyTitle: story.name,
      score: story.score,
      numberedDocument: numberDocumentLines(text),
    });
  }

  return {
    courses,
    stories: storyCandidates.slice(0, 15),
    documents,
  };
}

function buildPromptWithCandidates({
  title,
  body,
  hint,
  context,
  courses,
  stories,
  documents,
}: {
  title: string;
  body: string;
  hint: string;
  context: string;
  courses: CandidateCourse[];
  stories: CandidateStory[];
  documents: CandidateStoryDocument[];
}) {
  const { courseLines, storyLines } = formatCandidates(courses, stories);
  const documentBlocks =
    documents.length === 0
      ? ["- none"]
      : documents.map(
          (document) => `
Story ${document.storyId} (${document.courseShort ?? "null"}) ${JSON.stringify(document.storyTitle)} score=${document.score}
\`\`\`
${document.numberedDocument}
\`\`\`
`.trim(),
        );

  return `
You are matching a Discord issue report to a Duostories story and the exact editor line number.

Return JSON only, using the provided schema.

Rules:
- The editor link format is https://duostories.org/editor/course/{courseShort}/story/{storyId}?line={editorLine}
- The story link format is https://duostories.org/story/{storyId}?line={editorLine}
- The \`editorLine\` must be the raw document line number understood by the editor's \`?line=\` query param, not a logical story element index.
- \`editorLines\` should contain all explicitly relevant raw editor line numbers when the comment clearly points to multiple separate lines. Sort ascending and avoid duplicates.
- If multiple lines are relevant, set \`editorLine\` to the first item in \`editorLines\`.
- Prefer the provided live candidate data over guesses.
- You already have precomputed live candidate data below. Do not read .env files, tokens, secrets, auth config, or other sensitive files.
- Do not inspect .env, .env.local, credentials, tokens, OAuth secrets, or private keys.
- Use only the provided issue text and candidate data below. Do not do broader repo or filesystem searching.
- Candidate courses and stories have already been prefiltered below. Use them first.
- Top candidate story documents are included with raw editor line numbers. Prefer them over any extra searching.
- Same-author context is allowed only as a weak disambiguation hint when the current issue has no explicit course/language.
- Operator hint is allowed as a strong disambiguation hint when supplied through a trusted slash command.
- Never let same-author context override an explicit language/course in the current issue title or body.
- Never let an operator hint override an explicit language/course in the current issue title or body.
- Only set matchFound=true when you have a defensible story match.
- If you can determine the story but not a reliable exact line, set \`storyLink\` and leave \`editorLine\`/ \`editorLink\` null.
- Always produce a short Discord-ready \`draftMessage\` that the bot could post.
- Keep the draft concise and useful.
- Use this exact 4-line format for \`draftMessage\`:
  Possible story: <title> [<course_short>, id <story_id>, line/lines <line-or-unclear>]
  Editor link: <editor-link>  OR  Editor links: <link1> | <link2> | ...
  Story link: <public-story-link>  OR  Story links: <link1> | <link2> | ...
  Note: <short note>
- The editor link should always be the editor page for the matched story. If the line is known, include \`?line=\`; otherwise omit it.
- The story link should always be the public story page \`https://duostories.org/story/{storyId}\`. If the line is known, include \`?line=\`; otherwise omit it.
- If multiple lines are relevant, \`editorLinks\` and \`storyLinks\` should list one link per line.
- Keep the note mechanical and brief.
- If you cannot determine a reliable story id, return null link fields and low confidence instead of guessing.

Issue title:
${JSON.stringify(title)}

Issue body:
${JSON.stringify(body)}

Operator hint:
${hint ? JSON.stringify(hint) : "null"}

Same-author context:
${context ? JSON.stringify(context) : "null"}

Extracted hints:
- language_hint=${JSON.stringify(extractLanguageHint(title) || null)}
- set_hint=${JSON.stringify(extractSetHint(title))}
- title_without_hints=${JSON.stringify(stripTitleHints(title))}
- manual_hint=${JSON.stringify(hint || null)}
- body_language_hints=${JSON.stringify(extractBodyLanguageHints(body))}
- context_language_hints=${JSON.stringify([
    ...extractParenthesizedLanguageHints(context),
    ...extractBodyLanguageHints(context),
  ])}

Candidate courses:
${courseLines.join("\n")}

Candidate stories:
${storyLines.join("\n")}

Candidate story documents:
${documentBlocks.join("\n\n")}
`.trim();
}

async function runCodex(
  prompt: string,
  args: Pick<CliArgs, "cwd" | "model">,
): Promise<string> {
  const tempDir = await mkdtemp(join(tmpdir(), "story-link-codex-"));
  const outputFile = join(tempDir, "result.json");
  const schemaSourcePath = resolve(
    args.cwd,
    "scripts/story-issue-link-match.schema.json",
  );
  const schemaPath = join(tempDir, "story-issue-link-match.schema.json");
  await writeFile(schemaPath, await readFile(schemaSourcePath, "utf8"), "utf8");

  const codexArgs = [
    "exec",
    "--skip-git-repo-check",
    "--sandbox",
    "read-only",
    "--output-schema",
    schemaPath,
    "--output-last-message",
    outputFile,
    "--cd",
    tempDir,
    "-",
  ];

  if (args.model) {
    codexArgs.splice(1, 0, "--model", args.model);
  }

  try {
    await new Promise<void>((resolvePromise, rejectPromise) => {
      let stderr = "";
      const child: ChildProcessWithoutNullStreams = spawn(
        "pnpm",
        ["dlx", CODEX_CLI_PACKAGE, ...codexArgs],
        {
          cwd: tempDir,
          stdio: ["pipe", "pipe", "pipe"],
          env: buildCodexEnv(),
        },
      );

      child.on("error", rejectPromise);
      child.stdout.on("data", () => {
        // Ignore Codex exec stdout; the structured result is read from outputFile.
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.stdin.end(prompt);
      child.on("exit", (code) => {
        if (code === 0) {
          resolvePromise();
          return;
        }
        rejectPromise(
          new Error(
            `codex exec exited with code ${code}${
              stderr.trim() ? `\n${stderr.trim()}` : ""
            }`,
          ),
        );
      });
    });

    return await readFile(outputFile, "utf8");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

function buildCodexEnv(): NodeJS.ProcessEnv {
  const allowedKeys = [
    "PATH",
    "HOME",
    "OPENAI_API_KEY",
    "CODEX_HOME",
    "CODEX_API_KEY",
  ];
  return Object.fromEntries(
    allowedKeys.flatMap((key) =>
      process.env[key] ? [[key, process.env[key] as string]] : [],
    ),
  ) as NodeJS.ProcessEnv;
}

function validateMatch(value: unknown): StoryIssueLinkMatch {
  if (!value || typeof value !== "object") {
    throw new Error("Codex did not return a JSON object.");
  }

  const match = value as Partial<StoryIssueLinkMatch>;
  if (
    typeof match.matchFound !== "boolean" ||
    (match.confidence !== "high" &&
      match.confidence !== "medium" &&
      match.confidence !== "low") ||
    !Array.isArray(match.editorLines) ||
    !Array.isArray(match.editorLinks) ||
    !Array.isArray(match.storyLinks) ||
    !Array.isArray(match.evidence) ||
    typeof match.issueSummary !== "string" ||
    typeof match.notes !== "string" ||
    typeof match.draftMessage !== "string"
  ) {
    throw new Error("Codex returned JSON in an unexpected shape.");
  }

  const storyId = typeof match.storyId === "number" ? match.storyId : null;
  const courseShort =
    typeof match.courseShort === "string" ? match.courseShort : null;
  const editorLines = Array.from(
    new Set(
      match.editorLines.filter(
        (line): line is number =>
          typeof line === "number" && Number.isInteger(line) && line > 0,
      ),
    ),
  ).sort((a, b) => a - b);
  const editorLine =
    typeof match.editorLine === "number" &&
    Number.isInteger(match.editorLine) &&
    match.editorLine > 0
      ? match.editorLine
      : editorLines.length > 0
        ? editorLines[0]
        : null;
  const editorBaseLink =
    storyId !== null && courseShort
      ? `https://duostories.org/editor/course/${courseShort}/story/${storyId}`
      : null;
  const publicStoryBaseLink =
    storyId !== null ? `https://duostories.org/story/${storyId}` : null;
  const editorLink =
    editorBaseLink !== null
      ? editorLine !== null
        ? `${editorBaseLink}?line=${editorLine}`
        : editorBaseLink
      : null;
  const editorLinks =
    editorBaseLink !== null
      ? editorLines.map((line) => `${editorBaseLink}?line=${line}`)
      : [];
  const storyLink =
    publicStoryBaseLink !== null
      ? editorLine !== null
        ? `${publicStoryBaseLink}?line=${editorLine}`
        : publicStoryBaseLink
      : null;
  const storyLinks =
    publicStoryBaseLink !== null
      ? editorLines.map((line) => `${publicStoryBaseLink}?line=${line}`)
      : [];
  const draftMessage = buildDeterministicDraftMessage({
    storyTitle: typeof match.storyTitle === "string" ? match.storyTitle : null,
    courseShort,
    storyId,
    editorLine,
    editorLines,
    editorLink,
    editorLinks,
    storyLink,
    storyLinks,
  });

  return {
    matchFound: match.matchFound,
    confidence: match.confidence,
    storyId,
    courseShort,
    storyTitle: typeof match.storyTitle === "string" ? match.storyTitle : null,
    editorLine,
    editorLines,
    editorLink,
    editorLinks,
    storyLink,
    storyLinks,
    storyFile: typeof match.storyFile === "string" ? match.storyFile : null,
    issueSummary: match.issueSummary,
    evidence: match.evidence.map(String),
    notes: match.notes,
    draftMessage,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const stdinBody = args.body ? "" : await readStdin();
  const body = args.body || stdinBody;

  if (!args.title) {
    throw new Error("A non-empty --title is required.");
  }
  if (!body) {
    throw new Error("Provide --body or pipe the issue body on stdin.");
  }

  const candidateContext = await getCandidateContext(
    args.cwd,
    args.title,
    body,
    args.hint,
    args.context,
  );
  const prompt = buildPromptWithCandidates({
    title: args.title,
    body,
    hint: args.hint,
    context: args.context,
    courses: candidateContext.courses,
    stories: candidateContext.stories,
    documents: candidateContext.documents,
  });
  const rawOutput = await runCodex(prompt, args);
  const parsed = validateMatch(JSON.parse(rawOutput));

  if (args.raw) {
    process.stdout.write(`${rawOutput.trim()}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`);
}

main().catch((error) => {
  console.error("Story issue link lookup failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
