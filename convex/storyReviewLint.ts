"use node";

import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import {
  formatDiscordReview,
  lintStory,
  type LintFinding,
} from "@/lib/editor/lint";
import { hasNoAudioCourseTag } from "./lib/courseTags";
import type { FunctionReturnType } from "convex/server";

// Runs the story parser + lint for the Discord review bot. Lives in the Node
// runtime because the parser is bundled from src/ and is too heavy for the
// default runtime; the data comes from storyReview.getStoryReviewData.

type ReviewData = NonNullable<
  FunctionReturnType<typeof internal.storyReview.getStoryReviewData>
>;
type AvatarRows = FunctionReturnType<
  typeof internal.storyReview.getAvatarRowsByLanguageLegacyId
>;

export type ReviewResult = {
  storyId: number;
  found: boolean;
  name?: string;
  courseShort?: string;
  status?: string;
  setId?: number;
  setIndex?: number;
  learningLanguage?: string;
  noAudio?: boolean;
  text?: string;
  markdown?: string;
  findingCount?: number;
  errorCount?: number;
  warningCount?: number;
};

function lintOne(data: ReviewData, avatars: AvatarRows): ReviewResult {
  const avatarNames: Record<number, AvatarRows[number]> = {};
  for (const row of avatars) avatarNames[row.avatar_id] = row;
  const noAudio = hasNoAudioCourseTag(data.courseTags);

  const [story, meta] = processStoryFile(
    data.text,
    data.id,
    avatarNames,
    {
      learning_language: data.learningLanguageShort,
      from_language: data.fromLanguageShort,
    },
    "",
  );
  const findings: LintFinding[] = lintStory({
    text: data.text,
    story,
    meta,
    learningLanguage: data.learningLanguageShort,
    noAudio,
  });
  const parserErrors = story.elements.filter(
    (element) => element.type === "ERROR",
  ).length;

  const markdown = formatDiscordReview(
    {
      id: data.id,
      name: data.name,
      courseShort: data.courseShort,
      status: data.status,
      approvalCount: data.approvalCount,
    },
    findings,
    parserErrors,
  );

  return {
    storyId: data.id,
    found: true,
    name: data.name,
    courseShort: data.courseShort,
    status: data.status,
    setId: data.setId,
    setIndex: data.setIndex,
    learningLanguage: data.learningLanguageShort,
    noAudio,
    text: data.text,
    markdown,
    findingCount: findings.length,
    errorCount:
      parserErrors + findings.filter((f) => f.severity === "error").length,
    warningCount: findings.filter((f) => f.severity === "warning").length,
  };
}

export const lintStoriesForReview = internalAction({
  args: { storyIds: v.array(v.number()) },
  handler: async (ctx, args): Promise<ReviewResult[]> => {
    const results: ReviewResult[] = [];
    const avatarCache = new Map<number, AvatarRows>();
    for (const storyId of args.storyIds) {
      try {
        const data: ReviewData | null = await ctx.runQuery(
          internal.storyReview.getStoryReviewData,
          { storyId },
        );
        if (!data) {
          results.push({ storyId, found: false });
          continue;
        }
        let avatars = avatarCache.get(data.learningLanguageLegacyId);
        if (!avatars) {
          avatars = await ctx.runQuery(
            internal.storyReview.getAvatarRowsByLanguageLegacyId,
            { languageLegacyId: data.learningLanguageLegacyId },
          );
          avatarCache.set(data.learningLanguageLegacyId, avatars);
        }
        results.push(lintOne(data, avatars));
      } catch (error) {
        console.error(`lint failed for story ${storyId}`, error);
        results.push({
          storyId,
          found: true,
          markdown: `🤖 **Automatic story check** — #${storyId}\n🛑 The automatic check itself failed on this story. This is a bug in the checker, not necessarily in the story.`,
        });
      }
    }
    return results;
  },
});
