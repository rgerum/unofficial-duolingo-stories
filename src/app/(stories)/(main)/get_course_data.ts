import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";

export interface CourseData {
  id: number;
  short: string;
  name: string;
  count: number;
  about: string;
  tags: string[];
  from_language: number;
  fromLanguageId: Id<"languages">;
  from_language_name: string;
  learning_language: number;
  learningLanguageId: Id<"languages">;
  learning_language_name: string;
}

export async function get_course_data() {
  "use cache";
  cacheLife("hours");
  cacheTag("courses");
  return await fetchQuery(api.landing.getPublicCourseList, {});
}

export async function get_course(short: string) {
  for (let course of await get_course_data()) {
    if (course.short === short) {
      return course;
    }
  }
  return null;
}
