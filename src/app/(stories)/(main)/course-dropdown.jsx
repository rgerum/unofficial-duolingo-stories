"use client";
import styles from "./course-dropdown.module.css";
import Link from "next/link";
import Flag from "@/components/layout/flag";
import Dropdown from "@/components/layout/dropdown";
import { useSelectedLayoutSegment } from "next/navigation";

function LanguageButtonSmall({ course, flag_data }) {
  /**
   * A button in the language drop down menu (flag + name)
   */
  if (!course) return null;
  return (
    <Link
      className={styles.language_select_item}
      href={`/${course.short}`}
      data-cy="button_lang_dropdown"
    >
      <Flag iso={flag_data.iso} width={40} flag_file={flag_data.flag_file} />
      <span>{course.name}</span>
    </Link>
  );
}

export default function CourseDropdown({
  course_data_active,
  course_data,
  flag_data,
}) {
  function get_course_by_id(id) {
    for (let course of course_data) {
      if (course.id === id) return course;
    }
  }
  function get_course_by_short(short) {
    for (let course of course_data) {
      if (course.short === short) return course;
    }
  }

  const segment = useSelectedLayoutSegment();
  let course = get_course_by_short(segment);

  if (!course_data_active || course_data_active?.length === 0)
    return <div></div>;

  return (
    <Dropdown>
      <Flag
        width={40}
        iso={flag_data[course?.learning_language]?.iso}
        flag_file={flag_data[course?.learning_language]?.flag_file}
        className={styles.trigger}
      />
      <nav className={styles.header_lang_selector}>
        {course_data_active.map((id) => (
          <LanguageButtonSmall
            key={id}
            course={get_course_by_id(id)}
            flag_data={flag_data[get_course_by_id(id)?.learning_language]}
          />
        ))}
      </nav>
    </Dropdown>
  );
}
