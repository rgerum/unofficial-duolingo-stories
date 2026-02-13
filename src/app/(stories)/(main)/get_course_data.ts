import { api } from "@convex/_generated/api";
import { unstable_cache } from "next/cache";
import type { Id } from "@convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";

export interface CourseData {
  id: number;
  short: string;
  name: string;
  count: number;
  about: string;
  from_language: number;
  fromLanguageId: Id<"languages">;
  from_language_name: string;
  learning_language: number;
  learningLanguageId: Id<"languages">;
  learning_language_name: string;
}

export const get_course_data = unstable_cache(
  async () => await fetchQuery(api.landing.getPublicCourseList, {}),
  ["get_course_data_v2_convex_ids"],
  { tags: ["course_data"], revalidate: 3600 },
);

async function get_counts() {
  let data = { count_courses: 0, count_stories: 0 };
  for (let course of await get_course_data()) {
    data.count_courses += 1;
    data.count_stories += course.count;
  }
  return data;
}

async function get_course_groups() {
  const course_groups: Array<{
    from_language_name: string;
    fromLanguageId: Id<"languages">;
  }> = [];
  let englishGroup:
    | { from_language_name: string; fromLanguageId: Id<"languages"> }
    | null = null;
  let last_group = null;
  for (let course of await get_course_data()) {
    if (!course.fromLanguageId) continue;
    if (course.fromLanguageId !== last_group?.fromLanguageId) {
      const group = {
        from_language_name: course.from_language_name,
        fromLanguageId: course.fromLanguageId,
      };
      if (course.from_language_name === "English") {
        englishGroup = group;
      } else {
        course_groups.push(group);
      }
      last_group = course;
    }
  }
  if (englishGroup) {
    return [englishGroup, ...course_groups];
  }
  return course_groups;
}

async function get_courses_in_group(fromLanguageId: Id<"languages">) {
  let courses = await get_course_data();
  return courses.filter((course) => course.fromLanguageId === fromLanguageId);
}

export async function get_course(short: string) {
  for (let course of await get_course_data()) {
    if (course.short === short) {
      return course;
    }
  }
  return null;
}

async function get_done_course_ids_for_user() {
  const result = await fetchQuery(api.storyDone.getDoneCourseIdsForUser, {});
  return result ?? [];
}
