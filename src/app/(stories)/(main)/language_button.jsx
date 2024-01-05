import Link from "next/link";
import styles from "./language_button.module.css";
import { cache, Suspense } from "react";
import { sql } from "lib/db";
import get_localisation from "lib/get_localisation";
import FlagById from "components/layout/flag_by_id";

let get_courses = cache(async () => {
  let courses = await sql`
SELECT c.id,
       COALESCE(NULLIF(c.name, ''), l2.name) AS name,
       c.short,
       COUNT(s.id) AS count,
       c.learning_language,
       c.from_language
FROM course c
JOIN language l2 ON l2.id = c.learning_language
JOIN story s ON (c.id = s.course_id)
WHERE s.public AND NOT s.deleted AND c.public
GROUP BY c.id, l2.name;
    `;
  let courses_ids = {};
  for (let course of courses) {
    courses_ids[course.id] = course;
  }
  return courses_ids;
}); //, ["get_coursesXXXXZZZZXXXZyyy"]);

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
  if (!course_id) {
    return null;
  }
  let course = await get_course(course_id);
  if (!course) {
    return null;
  }
  let localisation = await get_localisation(course.from_language);

  return (
    <Link
      data-cy={"language_button_big_" + course.short}
      className={styles.language_select_button}
      href={`/${course.short}`}
    >
      <FlagById id={course.learning_language} />

      <span className={styles.language_select_button_text}>{course.name}</span>
      <span className={styles.language_story_count}>
        {localisation("n_stories", { $count: course.count })}
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
