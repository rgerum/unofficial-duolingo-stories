import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";

export interface StoryData {
  id: number;
  name: string;
  course_id: number;
  image: string;
  set_id: number;
  set_index: number;
  active: string;
  gilded: string;
  active_lip: string;
  gilded_lip: string;
}

export async function get_course_sets(
  courseShort: string
): Promise<Record<string, StoryData[]>> {
  const result = await fetchQuery(api.stories.getPublicStoriesByCourseShort, {
    courseShort,
  });

  return result ?? {};
}

export async function get_course_done({
  courseShort,
  user_id,
}: {
  courseShort: string;
  user_id?: number;
}): Promise<Record<number, boolean>> {
  if (!user_id) {
    return {};
  }

  const result = await fetchQuery(
    api.storyCompletions.getCompletedByUserAndCourse,
    {
      userLegacyId: user_id,
      courseShort,
    }
  );

  return result;
}
