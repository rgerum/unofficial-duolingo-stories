import { sql } from "lib/db";
import { CourseList } from "./courses";

async function course_list() {
  return await sql`SELECT
    course.id,
    course.learning_language,
    course.from_language,
    course.public,
    course.official,
    course.name,
    course.about,
    course.conlang,
    course.short,
    course.tags
FROM course;
`;
}

async function language_list() {
  return await sql`SELECT * FROM language;`;
}

export default async function Page({}) {
  let courses = await course_list();
  let languages = await language_list();

  return (
    <>
      <CourseList all_courses={courses} languages={languages} />
    </>
  );
}
