import { sql, cache } from "../../../lib/db";

export const get_course_data = cache(
  async () => {
    return sql`
SELECT id, short, COALESCE(NULLIF(name, ''), learning_language_name) AS name, count, about,
from_language, from_language_name,
learning_language, learning_language_name
FROM
    course c
WHERE
    c.public
ORDER BY
    from_language_name, name;
`;
  },
  ["get_course_data"],
  { tags: ["course_data"], revalidate: 3600 },
);

export async function get_counts() {
  let data = { count_courses: 0, count_stories: 0 };
  for (let course of await get_course_data()) {
    data.count_courses += 1;
    data.count_stories += course.count;
  }
  return data;
}

export async function get_course_groups() {
  let course_groups = [{ from_language_name: "English", from_language: 1 }];
  let last_group = null;
  for (let course of await get_course_data()) {
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

export async function get_courses_in_group(from_language) {
  let courses = await get_course_data();
  return courses.filter((course) => course.from_language === from_language);
}

export async function get_course(short) {
  for (let course of await get_course_data()) {
    if (course.short === short) {
      return course;
    }
  }
  return null;
}
