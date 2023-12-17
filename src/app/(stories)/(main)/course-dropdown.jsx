"use client";
import styles from "./course-dropdown.module.css";
import Link from "next/link";
import Flag from "components/layout/flag";
import Dropdown from "components/layout/dropdown";
import { useSelectedLayoutSegment } from "next/navigation";

function LanguageButtonSmall({ course }) {
  /**
   * A button in the language drop down menu (flag + name)
   */
  return (
    <Link
      className={styles.language_select_item}
      href={`/${course.short}`}
      data-cy="button_lang_dropdown"
    >
      <Flag
        iso={course.learning_language}
        width={40}
        flag={course.learning_language_flag}
        flag_file={course.learning_language_flag_file}
      />
      <span>{course.name || course.learning_language_name}</span>
    </Link>
  );
}

export default function CourseDropdown({ all_courses_flags, course_data }) {
  const segment = useSelectedLayoutSegment();
  let course = all_courses_flags[segment];

  if (!course_data || course_data?.length === 0) return <div></div>;

  return (
    <Dropdown>
      <Flag
        iso={course?.learning_language}
        width={40}
        flag={course?.learning_language_flag}
        flag_file={course?.learning_language_flag_file}
      />
      <nav className={styles.header_lang_selector}>
        {course_data.map((id) => (
          <LanguageButtonSmall
            key={id.short}
            course={all_courses_flags[id.short]}
          />
        ))}
      </nav>
    </Dropdown>
  );
}
