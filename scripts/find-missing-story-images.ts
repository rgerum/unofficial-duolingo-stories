import dotenv from "dotenv";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { mkdir, writeFile } from "node:fs/promises";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const CONCURRENCY = Number(process.env.STORY_IMAGE_AUDIT_CONCURRENCY ?? "20");
const PUBLISHED_ONLY = parseBooleanEnv(
  process.env.STORY_IMAGE_AUDIT_PUBLISHED_ONLY,
  true,
);

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL/CONVEX_URL is not set.");
  process.exit(1);
}

if (!Number.isFinite(CONCURRENCY) || CONCURRENCY <= 0) {
  console.error("Error: STORY_IMAGE_AUDIT_CONCURRENCY must be a positive number.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

type StorySummary = {
  id: number;
  name: string;
  course_id: number;
  image: string;
  course_short: string | null;
  public: boolean;
};

type Finding = {
  storyId: number;
  storyName: string;
  courseId: number;
  courseShort: string;
  reasons: string[];
};

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker(),
  );
  await Promise.all(workers);
  return results;
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return defaultValue;
}

async function getAllStories(): Promise<StorySummary[]> {
  const sidebar = await client.query(api.editorRead.getEditorSidebarData, {});
  const courses = sidebar.courses ?? [];

  const storiesByCourse = await mapWithConcurrency(
    courses,
    Math.min(CONCURRENCY, 10),
    async (course) => {
      const identifier = String(course.id);
      const stories = await client.query(
        api.editorRead.getEditorStoriesByCourseLegacyId,
        { identifier },
      );

      return stories.map((story) => ({
        id: story.id,
        name: story.name,
        course_id: story.course_id,
        image: story.image,
        course_short: course.short,
        public: story.public,
      }));
    },
  );

  return storiesByCourse.flat();
}

async function main() {
  console.log("Loading course/story lists...");
  const allStories = await getAllStories();
  const stories = PUBLISHED_ONLY
    ? allStories.filter((story) => story.public)
    : allStories;

  console.log(
    `Found ${allStories.length} stories total; scanning ${stories.length} ${PUBLISHED_ONLY ? "published" : "all"} stories for image fields...`,
  );

  const findings = (
    await mapWithConcurrency(stories, CONCURRENCY, async (story, index) => {
      if (index > 0 && index % 200 === 0) {
        console.log(`Checked ${index}/${stories.length} stories...`);
      }

      const reasons: string[] = [];
      const detail = await client.query(api.storyRead.getStoryByLegacyId, {
        storyId: story.id,
      });

      if (!detail) {
        reasons.push("missing_story_payload");
      } else {
        if (!detail.illustrations.active.trim()) {
          reasons.push("missing_illustration_active");
        }
        if (!detail.illustrations.gilded.trim()) {
          reasons.push("missing_illustration_gilded");
        }
        if (!detail.illustrations.locked.trim()) {
          reasons.push("missing_illustration_locked");
        }
      }

      if (!story.image.trim()) {
        reasons.push("missing_story_image_id");
      }

      if (reasons.length === 0) return null;

      return {
        storyId: story.id,
        storyName: story.name,
        courseId: story.course_id,
        courseShort: story.course_short ?? "",
        reasons,
      } satisfies Finding;
    })
  ).filter((finding): finding is Finding => finding !== null);

  const outputPath = PUBLISHED_ONLY
    ? "tmp/missing-story-images-published.json"
    : "tmp/missing-story-images-all.json";

  await mkdir("tmp", { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        publishedOnly: PUBLISHED_ONLY,
        totalStoriesFound: allStories.length,
        totalStoriesScanned: stories.length,
        totalIssues: findings.length,
        findings,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log("\n=== Image Audit Summary ===");
  console.log(`Total stories scanned: ${stories.length}`);
  console.log(`Stories with issues: ${findings.length}`);

  if (findings.length === 0) {
    console.log("No stories with missing images were found.");
    console.log(`Results saved to ${outputPath}`);
    return;
  }

  const reasonCount = new Map<string, number>();
  for (const finding of findings) {
    for (const reason of finding.reasons) {
      reasonCount.set(reason, (reasonCount.get(reason) ?? 0) + 1);
    }
  }

  console.log("\nIssue counts by reason:");
  for (const [reason, count] of Array.from(reasonCount.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`- ${reason}: ${count}`);
  }

  console.log("\nAffected stories:");
  for (const finding of findings.sort((a, b) => a.storyId - b.storyId)) {
    console.log(
      `- story=${finding.storyId} course=${finding.courseId} (${finding.courseShort}) name=${JSON.stringify(finding.storyName)} reasons=${finding.reasons.join(",")}`,
    );
  }

  console.log(`\nResults saved to ${outputPath}`);
}

main().catch((error) => {
  console.error("Story image audit failed:");
  console.error(error);
  process.exit(1);
});
