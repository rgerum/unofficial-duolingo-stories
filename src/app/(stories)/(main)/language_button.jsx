import Link from "next/link";
import styles from "./language_button.module.css";
import { Suspense } from "react";
import get_localisation from "lib/get_localisation";
import FlagById from "components/layout/flag_by_id";
import { get_course } from "./get_course_data";

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
