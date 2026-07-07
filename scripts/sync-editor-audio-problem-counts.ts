import { spawn } from "node:child_process";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import { checkStoryLineAudio } from "@/app/editor/story/[story]/v2/audio_problem_check";

type CliOptions = {
  courses: string[];
  apply: boolean;
  identity: string | null;
  prod: boolean;
};

type CoursePayload = {
  courseShort: string;
  legacyCourseId: number;
  learningLanguage: string;
  fromLanguage: string;
  ttsReplace: string;
  stories: StoryPayload[];
};

type CourseMetadata = Omit<CoursePayload, "stories">;

type StoryPayload = {
  legacyStoryId: number;
  text: string;
};

type CourseStoryPage = {
  stories: StoryPayload[];
  continueCursor: string | null;
  isDone: boolean;
};

type StoryAudioProblemCount = {
  legacyStoryId: number;
  audioProblemCount: number;
};

type CourseProblemPayload = {
  course: {
    courseShort: string;
    audioProblemCount: number;
  };
  stories: StoryAudioProblemCount[];
};

function usage(exitCode: 0 | 1): never {
  console.error(`Usage:
  pnpm audio:sync-editor-problem-counts -- --course pt-PT-en --apply --prod

Options:
  --course <short>    Course to sync. Can be repeated. Defaults to all courses.
  --apply             Apply to Convex. Without this, print the payload only.
  --identity <json>   Convex run identity. Required with --apply.
  --prod              Target the production Convex deployment.
`);
  process.exit(exitCode);
}

function takeValue(args: string[], index: number, name: string) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`Missing value for ${name}.`);
  }
  return value;
}

function parseCliOptions(args: string[]): CliOptions {
  const courses: string[] = [];
  let apply = false;
  let identity: string | null = null;
  let prod = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") continue;
    if (arg === "--help" || arg === "-h") usage(0);
    if (arg === "--course") {
      courses.push(takeValue(args, index, arg));
      index += 1;
      continue;
    }
    if (arg === "--apply") {
      apply = true;
      continue;
    }
    if (arg === "--prod") {
      prod = true;
      continue;
    }
    if (arg === "--identity") {
      identity = takeValue(args, index, arg);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return { courses, apply, identity, prod };
}

function runCommand(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
  });
}

function runCommandOutput(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "inherit"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${command} ${args.join(" ")} failed with ${code}`));
    });
  });
}

function parseJsonOutput<T>(stdout: string): T {
  const trimmed = stdout.trim();
  const candidateStarts = [...trimmed.matchAll(/[\[{]/g)].map(
    (match) => match.index,
  );
  if (candidateStarts.length === 0) {
    throw new Error("Convex command did not print JSON.");
  }

  for (const jsonStart of candidateStarts) {
    if (jsonStart === undefined) continue;
    const jsonEnd = findJsonEnd(trimmed, jsonStart);
    if (jsonEnd === null) continue;
    try {
      return JSON.parse(trimmed.slice(jsonStart, jsonEnd)) as T;
    } catch {
      // Keep scanning; command output can include warnings before JSON.
    }
  }

  throw new Error("Convex command did not print valid JSON.");
}

function findJsonEnd(text: string, start: number) {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "{") {
      stack.push("}");
      continue;
    }
    if (char === "[") {
      stack.push("]");
      continue;
    }
    if (char === "}" || char === "]") {
      if (stack.pop() !== char) return null;
      if (stack.length === 0) return index + 1;
    }
  }

  return null;
}

async function readCourseShorts(prod: boolean) {
  const query = `const courses = await ctx.db.query("courses").collect();
return courses
  .filter((course) => !course.deleted && typeof course.short === "string" && course.short.length > 0)
  .map((course) => course.short)
  .sort();`;
  const args = ["convex", "run"];
  if (prod) args.push("--prod");
  args.push("--inline-query", query);
  return parseJsonOutput<string[]>(await runCommandOutput("pnpm", args));
}

async function readCourseMetadata(courseShort: string, prod: boolean) {
  const query = `const course = await ctx.db
  .query("courses")
  .withIndex("by_short", (q) => q.eq("short", ${JSON.stringify(courseShort)}))
  .unique();
if (!course || course.deleted) return null;
const [learningLanguage, fromLanguage] = await Promise.all([
  ctx.db.get(course.learningLanguageId),
  ctx.db.get(course.fromLanguageId),
]);
return {
  courseShort: course.short,
  legacyCourseId: course.legacyId,
  learningLanguage: learningLanguage?.short ?? "",
  fromLanguage: fromLanguage?.short ?? "",
  ttsReplace: learningLanguage?.tts_replace ?? "",
};`;
  const args = ["convex", "run"];
  if (prod) args.push("--prod");
  args.push("--inline-query", query);
  return parseJsonOutput<CourseMetadata | null>(
    await runCommandOutput("pnpm", args),
  );
}

async function readCourseStoryPage(
  courseShort: string,
  cursor: string | null,
  prod: boolean,
) {
  const query = `const course = await ctx.db
  .query("courses")
  .withIndex("by_short", (q) => q.eq("short", ${JSON.stringify(courseShort)}))
  .unique();
if (!course || course.deleted) return null;
const stories = await ctx.db
  .query("stories")
  .withIndex("by_course", (q) => q.eq("courseId", course._id))
  .paginate({ cursor: ${JSON.stringify(cursor)}, numItems: 25 });
const out = [];
for (const story of stories.page) {
  if (!story.public || story.deleted || typeof story.legacyId !== "number") continue;
  const content = await ctx.db
    .query("story_content")
    .withIndex("by_story", (q) => q.eq("storyId", story._id))
    .unique();
  if (!content) continue;
  out.push({ legacyStoryId: story.legacyId, text: content.text });
}
return {
  stories: out,
  continueCursor: stories.continueCursor ?? null,
  isDone: stories.isDone,
};`;
  const args = ["convex", "run"];
  if (prod) args.push("--prod");
  args.push("--inline-query", query);
  return parseJsonOutput<CourseStoryPage | null>(
    await runCommandOutput("pnpm", args),
  );
}

async function readCoursePayload(courseShort: string, prod: boolean) {
  const metadata = await readCourseMetadata(courseShort, prod);
  if (!metadata) return null;

  const stories: StoryPayload[] = [];
  let cursor: string | null = null;
  do {
    const page = await readCourseStoryPage(courseShort, cursor, prod);
    if (!page) return null;
    stories.push(...page.stories);
    cursor = page.isDone ? null : page.continueCursor;
  } while (cursor);

  console.error(`Loaded ${stories.length} published stories for ${courseShort}`);
  return { ...metadata, stories };
}

async function buildCourseProblemPayload(course: CoursePayload) {
  let audioProblemCount = 0;
  const stories: StoryAudioProblemCount[] = [];
  const details = [];

  for (const story of course.stories) {
    const [parsedStory] = processStoryFile(
      story.text,
      story.legacyStoryId,
      {},
      {
        learning_language: course.learningLanguage,
        from_language: course.fromLanguage,
      },
      course.ttsReplace,
    );
    const audioCheck = await checkStoryLineAudio(parsedStory);
    audioProblemCount += audioCheck.audioProblemCount;
    stories.push({
      legacyStoryId: story.legacyStoryId,
      audioProblemCount: audioCheck.audioProblemCount,
    });
    if (audioCheck.audioProblemCount > 0) {
      details.push({
        legacyStoryId: story.legacyStoryId,
        ...audioCheck,
      });
    }
  }

  return {
    payload: {
      course: {
        courseShort: course.courseShort,
        audioProblemCount,
      },
      stories,
    },
    details,
  };
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const selectedCourses =
    options.courses.length > 0
      ? options.courses
      : await readCourseShorts(options.prod);

  const coursePayloads: CourseProblemPayload[] = [];
  const details = [];
  const skipped = [];

  for (const courseShort of selectedCourses) {
    const course = await readCoursePayload(courseShort, options.prod);
    if (!course) {
      skipped.push(courseShort);
      continue;
    }
    const result = await buildCourseProblemPayload(course);
    coursePayloads.push(result.payload);
    details.push(
      ...result.details.map((detail) => ({
        courseShort,
        ...detail,
      })),
    );
  }

  const counts = coursePayloads.map((entry) => entry.course);
  const stories = coursePayloads.flatMap((entry) => entry.stories);
  console.log(
    JSON.stringify(
      {
        counts,
        stories,
        details,
        skipped,
        storyCount: stories.length,
        problemStoryCount: details.length,
      },
      null,
      2,
    ),
  );

  if (!options.apply) return;
  if (!options.identity) {
    throw new Error("--identity is required when using --apply.");
  }
  if (counts.length === 0) {
    console.log("No counts to apply.");
    return;
  }

  const operationKey = `editor-audio-problem-counts:${Date.now()}`;
  const chunkSize = 20;
  for (let index = 0; index < coursePayloads.length; index += chunkSize) {
    const chunk = coursePayloads.slice(index, index + chunkSize);
    const chunkPayload = {
      operationKey: `${operationKey}:${Math.floor(index / chunkSize) + 1}`,
      counts: chunk.map((entry) => entry.course),
      stories: chunk.flatMap((entry) => entry.stories),
    };
    console.log(
      `Applying chunk ${Math.floor(index / chunkSize) + 1}/${Math.ceil(
        coursePayloads.length / chunkSize,
      )}: courses=${chunkPayload.counts.length} stories=${chunkPayload.stories.length}`,
    );
    const args = ["convex", "run"];
    if (options.prod) args.push("--prod");
    args.push(
      "courseWrite:setAudioProblemCounts",
      JSON.stringify(chunkPayload),
      "--identity",
      options.identity,
    );
    await runCommand("pnpm", args);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
