import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export interface LanguageProps {
  id: number;
  short: string;
  flag: number | null;
  flag_file: string | null;
}

export async function get_language_list_data(): Promise<Record<string | number, LanguageProps>> {
  return await fetchQuery(api.editor.getLanguageList, {});
}

export interface CourseProps {
  id: number;
  short: string | null;
  about: string | null;
  official: boolean;
  count: number;
  public: boolean;
  from_language: number;
  from_language_name: string;
  learning_language: number;
  learning_language_name: string;
  contributors: string[];
  contributors_past: string[];
  todo_count: number;
}

export async function get_course_list_data(): Promise<CourseProps[]> {
  return await fetchQuery(api.editor.getCourseList, {});
}

export async function get_course_data(id: string | number): Promise<CourseProps | undefined> {
  const result = await fetchQuery(api.editor.getCourse, { id });
  return result ?? undefined;
}

export interface StoryListDataProps {
  id: number;
  name: string;
  course_id: number;
  image: string;
  set_id: number;
  set_index: number;
  date: number; // timestamp
  change_date: number; // timestamp
  status: string;
  public: boolean;
  todo_count: number;
  approvals: number[] | null;
  author: string;
  author_change: string | null;
}

export async function get_story_list_data(): Promise<Record<number, StoryListDataProps[]>> {
  // Get all courses first
  const courses = await fetchQuery(api.editor.getCourseList, {});

  // Load stories for each course - now fast! No pagination needed!
  const result: Record<number, StoryListDataProps[]> = {};

  for (const course of courses) {
    const stories = await fetchQuery(api.editor.getStoriesForCourseEditor, {
      courseLegacyId: course.id,
    });
    result[course.id] = stories;
  }

  return result;
}

export async function get_story_list(course_id: number): Promise<StoryListDataProps[]> {
  // Direct query - loads all stories at once (fast because no content fields!)
  return await fetchQuery(api.editor.getStoriesForCourseEditor, {
    courseLegacyId: course_id,
  });
}

export interface CourseImportProps {
  id: number;
  set_id: number;
  set_index: number;
  name: string;
  image_done: string;
  image: string;
  copies: string;
}

export async function get_course_import({
  course_id,
  from_id,
}: {
  course_id: number;
  from_id: number;
}): Promise<CourseImportProps[]> {
  return await fetchQuery(api.editor.getCourseImport, {
    courseLegacyId: course_id,
    fromCourseLegacyId: from_id,
  });
}
