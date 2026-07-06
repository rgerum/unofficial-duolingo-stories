import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type CourseStory = Doc<"stories">;

export async function loadCourseStories(
  ctx: MutationCtx,
  courseId: Id<"courses">,
) {
  return await ctx.db
    .query("stories")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .collect();
}

export async function recomputeCoursePublishedCount(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  stories?: CourseStory[],
) {
  const course = await ctx.db.get(courseId);
  if (!course) {
    throw new Error(`Course ${courseId} not found`);
  }

  const courseStories = stories ?? (await loadCourseStories(ctx, courseId));
  const count = courseStories.filter(
    (story) => story.public && !story.deleted,
  ).length;

  if (course.count !== count) {
    await ctx.db.patch(courseId, { count });
  }

  return count;
}

export async function recomputeCourseAudioProblemCount(
  ctx: MutationCtx,
  courseId: Id<"courses">,
  stories?: CourseStory[],
) {
  const course = await ctx.db.get(courseId);
  if (!course) {
    throw new Error(`Course ${courseId} not found`);
  }

  const courseStories = stories ?? (await loadCourseStories(ctx, courseId));
  const count = courseStories.reduce((total, story) => {
    if (!story.public || story.deleted) return total;
    return total + (story.audio_problem_count ?? 0);
  }, 0);

  if ((course.audio_problem_count ?? 0) !== count) {
    await ctx.db.patch(courseId, { audio_problem_count: count });
  }

  return count;
}
