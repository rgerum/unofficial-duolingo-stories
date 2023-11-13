import Link from "next/link";
import styles from "./language_button.module.css";
import { cache, Suspense } from "react";
import { query_objs } from "../../../lib/db";
import FlagById from "components/layout/flag_by_id";
import { unstable_cache } from "next/cache";

let get_courses = unstable_cache(async () => {
  let courses = await query_objs(
    `
SELECT c.id, COALESCE(NULLIF(c.name, ''), l2.name) as name, c.short, COUNT(s.id) count, c.learningLanguage FROM course c
JOIN language l2 ON l2.id = c.learningLanguage
JOIN story s ON (c.id = s.course_id)
WHERE s.public = 1 AND s.deleted = 0 AND c.public = 1
GROUP BY c.id
    `,
    [],
  );
  let courses_ids = {};
  for (let course of courses) {
    courses_ids[course.id] = course;
  }
  return courses_ids;
}, ["get_courses"]);

let get_course = cache(async (id) => {
  return (await get_courses())[id];
});

export default async function LanguageButton({ course_id, loading }) {
  if (loading) {
    return (
      <div
        className={
          styles.language_select_button + " " + styles.animated_background
        }
      ></div>
    );
  }
  let course = await get_course(course_id);
  if (!course) {
    return (
      <div
        className={
          styles.language_select_button + " " + styles.animated_background
        }
      ></div>
    );
  }

  return (
    <Link
      data-cy={"language_button_big_" + course.short}
      className={styles.language_select_button}
      href={`/${course.short}`}
    >
      <FlagById id={course.learningLanguage} />

      <span className={styles.language_select_button_text}>{course.name}</span>
      <span className={styles.language_story_count}>
        {course.count} stories
      </span>
    </Link>
  );
}

export async function LanguageButtonSuspense({ course_id }) {
  return <LanguageButton course_id={course_id} />;
  return (
    <Suspense fallback={<LanguageButton loading={true} />}>
      <LanguageButton course_id={course_id} />
    </Suspense>
  );
}
