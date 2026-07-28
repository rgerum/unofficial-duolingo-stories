import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type PublicCourseStory = {
  story: Doc<"stories">;
  legacyId: number;
  image: Doc<"images">;
  set_id: number;
  set_index: number;
};

/**
 * Single source of truth for "which stories of a course may be listed or
 * linked to publicly".
 *
 * A story qualifies when it is `public`, not `deleted`, has a numeric legacy
 * id (the `/story/{id}` route key) and has usable illustrations. The course
 * itself still has to be checked by the caller (`course.public`).
 *
 * Both the course page listing and the story cross-links go through here so
 * they can never drift apart and start linking to unpublished stories.
 */
export async function listPublicCourseStories(
  ctx: QueryCtx,
  courseId: Id<"courses">,
): Promise<PublicCourseStory[]> {
  const stories = await ctx.db
    .query("stories")
    .withIndex("by_course_public_deleted_set", (q) =>
      q.eq("courseId", courseId).eq("public", true).eq("deleted", false),
    )
    .collect();

  const imageIds = Array.from(
    new Set(
      stories
        .map((story) => story.imageId)
        .filter((imageId): imageId is Id<"images"> => !!imageId),
    ),
  );
  const imageRows = await Promise.all(
    imageIds.map(async (imageId) => ({
      imageId,
      image: await ctx.db.get(imageId),
    })),
  );
  const imageById = new Map<Id<"images">, Doc<"images"> | null>();
  for (const row of imageRows) imageById.set(row.imageId, row.image);

  return stories
    .map((story) => {
      if (typeof story.legacyId !== "number") return null;
      const image = story.imageId ? imageById.get(story.imageId) : null;
      if (!image?.active || !image?.gilded) return null;
      return {
        story,
        legacyId: story.legacyId,
        image,
        set_id: story.set_id ?? 0,
        set_index: story.set_index ?? 0,
      };
    })
    .filter((entry): entry is PublicCourseStory => entry !== null)
    .sort((a, b) => {
      const setCmp = a.set_id - b.set_id;
      if (setCmp !== 0) return setCmp;
      return a.set_index - b.set_index;
    });
}
