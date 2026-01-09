import Link from "next/link";
import Flag from "./flag.tsx";
import styles from "./language_button.module.css";

export default function LanguageButton({ course }) {
  return (
    <Link
      data-cy={"language_button_big_" + course.short}
      className={styles.language_select_button}
      href={`/${course.learning_language}-${course.from_language}`}
    >
      <Flag
        iso={course.learning_language}
        flag={course.learning_language_flag}
        flag_file={course.learning_language_flag_file}
      />
      <span className={styles.language_select_button_text}>{course.name}</span>
      <span className={styles.language_story_count}>
        {course.count} stories
      </span>
      {course.conlang ? <span className={styles.conlang}>conlang</span> : <></>}
    </Link>
  );
}
