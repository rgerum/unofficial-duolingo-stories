import Link from "next/link";
import Flag from "components/layout/flag";
import styles from "./language_button.module.css";
import { cache, Suspense } from "react";
import { query_one_obj, query_objs } from "../../../lib/db";
import FlagById from "../../../components/layout/flag_by_id";
import { unstable_cache } from "next/cache";

let get_courses = unstable_cache(async () => {
  let courses = await query_objs(
    `
SELECT 
course.id,  
COALESCE(NULLIF(course.name, ''), l2.name) as name, course.short,
l1.name AS fromLanguageName,
 course.learningLanguage AS learningLanguageId,
 COUNT(story.id) count, course.public, course.official, course.conlang FROM course
JOIN language l1 ON l1.id = course.fromLanguage
JOIN language l2 ON l2.id = course.learningLanguage
JOIN story ON (course.id = story.course_id)
WHERE story.public = 1 AND story.deleted = 0 AND course.public = 1
GROUP BY course.id
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

export default async function LanguageButton({
  course_id,
  incubator,
  loading,
}) {
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
      <FlagById id={course.learningLanguageId} />

      <span className={styles.language_select_button_text}>{course.name}</span>
      {incubator ? (
        <span style={{ fontSize: "0.8em" }}>
          (from {course.fromLanguageName})
        </span>
      ) : (
        <></>
      )}
      <span className={styles.language_story_count}>
        {course.count} stories
      </span>
    </Link>
  );
}

export async function LanguageButtonSuspense({ course_id }) {
  return (
    <Suspense fallback={<LanguageButton loading={true} />}>
      <LanguageButton course_id={course_id} />
    </Suspense>
  );
}
