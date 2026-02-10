import Link from "next/link";
import styles from "./language_button.module.css";
import {
  get_localisation_by_convex_language_id,
} from "@/lib/get_localisation";
import FlagByConvexId from "@/components/layout/flag_by_convex_id";
import { get_course } from "./get_course_data";

export default async function LanguageButton({
  course_id,
  loading,
}: {
  course_id?: string;
  loading?: boolean;
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
  if (!course_id) {
    return null;
  }
  let course = await get_course(course_id);
  if (!course) {
    return null;
  }
  let localisation = await get_localisation_by_convex_language_id(
    course.fromLanguageId,
  );

  return (
    <Link
      data-cy={"language_button_big_" + course.short}
      className={styles.language_select_button}
      href={`/${course.short}`}
    >
      <FlagByConvexId id={course.learningLanguageId} />
      <span className={styles.language_select_button_text}>{course.name}</span>
      <span className={styles.language_story_count}>
        {localisation("n_stories", { $count: `${course.count}` })}
      </span>
    </Link>
  );
}
