"use client";
import styles from "./course-dropdown.module.css";
import Link from "next/link";
import Flag from "@/components/layout/flag";
import Dropdown from "@/components/layout/dropdown";
import { useSelectedLayoutSegment } from "next/navigation";
import { CourseData } from "@/app/(stories)/(main)/get_course_data";
import { LanguageProps } from "@/app/editor/(course)/db_get_course_editor";

function LanguageButtonSmall({
  course,
  flag_data,
}: {
  course?: CourseData;
  flag_data?: LanguageProps;
}) {
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
      <Flag
        iso={flag_data?.short}
        width={40}
        flag_file={flag_data?.flag_file}
      />
      <span>{course.name}</span>
    </Link>
  );
}

export default function CourseDropdown({
  course_data_active,
  course_data,
  flag_data,
}: {
  course_data_active: number[];
  course_data?: CourseData[];
  flag_data: Record<number, LanguageProps>;
}) {
  function get_course_by_id(id: number) {
    if (!course_data) return undefined;
    for (let course of course_data) {
      if (course.id === id) return course;
    }
  }
  function get_flag_by_id(id: number) {
    const course = get_course_by_id(id);
    if (!course) return undefined;
    return flag_data[course.learning_language];
  }
  function get_course_by_short(short: string) {
    if (!course_data) return undefined;
    for (let course of course_data) {
      if (course.short === short) return course;
    }
  }

  const segment = useSelectedLayoutSegment();
  let course = get_course_by_short(segment || "");

  if (!course_data_active || course_data_active?.length === 0)
    return <div></div>;

  return (
    <Dropdown>
      <Flag
        width={40}
        iso={
          course?.learning_language
            ? flag_data[course?.learning_language]?.short
            : undefined
        }
        flag_file={
          course?.learning_language
            ? flag_data[course?.learning_language]?.flag_file
            : undefined
        }
        className={styles.trigger}
      />
      <nav className={styles.header_lang_selector}>
        {course_data_active.map((id) => (
          <LanguageButtonSmall
            key={id}
            course={get_course_by_id(id)}
            flag_data={get_flag_by_id(id)}
          />
        ))}
      </nav>
    </Dropdown>
  );
}
