import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export interface CourseData {
  id: number;
  short: string;
  name: string;
  count: number;
  about: string;
  from_language: number;
  from_language_name: string;
  learning_language: number;
  learning_language_name: string;
}

/**
 * Fetch all public courses from Convex
 * This replaces the PostgreSQL query in get_course_data.ts
 */
export async function get_course_data(): Promise<CourseData[]> {
  const courses = await fetchQuery(api.courses.listPublicForComparison);
  return courses;
}

export async function get_counts() {
  const courses = await get_course_data();
  let data = { count_courses: 0, count_stories: 0 };
  for (let course of courses) {
    data.count_courses += 1;
    data.count_stories += course.count;
  }
  return data;
}

export async function get_course_groups() {
  const courses = await get_course_data();
  let course_groups = [{ from_language_name: "English", from_language: 1 }];
  let last_group: CourseData | null = null;

  for (let course of courses) {
    if (course.from_language !== last_group?.from_language) {
      if (course.from_language_name !== "English")
        course_groups.push({
          from_language_name: course.from_language_name,
          from_language: course.from_language,
        });
      last_group = course;
    }
  }
  return course_groups;
}

export async function get_courses_in_group(from_language: number) {
  let courses = await get_course_data();
  return courses.filter((course) => course.from_language === from_language);
}

export async function get_course(short: string) {
  for (let course of await get_course_data()) {
    if (course.short === short) {
      return course;
    }
  }
  return null;
}
