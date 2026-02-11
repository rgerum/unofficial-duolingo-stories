"use client";
import styles from "./course-dropdown.module.css";
import Link from "next/link";
import Flag from "@/components/layout/flag";
import Dropdown from "@/components/layout/dropdown";
import { useSelectedLayoutSegment } from "next/navigation";
import { CourseData } from "@/app/(stories)/(main)/get_course_data";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

function LanguageButtonSmall({
  course,
}: {
  course?: CourseData;
}) {
  /**
   * A button in the language drop down menu (flag + name)
   */
  if (!course) return null;
  const language = useQuery(api.localization.getLanguageFlagById, {
    languageId: course.learningLanguageId,
  });
  return (
    <Link
      className={styles.language_select_item}
      href={`/${course.short}`}
      data-cy="button_lang_dropdown"
    >
      <Flag
        iso={language?.short}
        width={40}
        flag_file={language?.flag_file ?? undefined}
        flag={
          typeof language?.flag === "number"
            ? language.flag
            : Number.isFinite(Number(language?.flag))
              ? Number(language?.flag)
              : undefined
        }
      />
      <span>{course.name}</span>
    </Link>
  );
}

export default function CourseDropdown({
  course_data_active,
  course_data,
}: {
  course_data_active: number[];
  course_data?: CourseData[];
}) {
  function get_course_by_id(id: number) {
    if (!course_data) return undefined;
    for (let course of course_data) {
      if (course.id === id) return course;
    }
  }
  function get_course_by_short(short: string) {
    if (!course_data) return undefined;
    for (let course of course_data) {
      if (course.short === short) return course;
    }
  }

  const segment = useSelectedLayoutSegment();
  let course = get_course_by_short(segment || "");
  const activeCourseLanguage = useQuery(
    api.localization.getLanguageFlagById,
    course ? { languageId: course.learningLanguageId } : "skip",
  );

  if (!course_data_active || course_data_active?.length === 0)
    return <div></div>;

  return (
    <Dropdown>
      <Flag
        width={40}
        iso={activeCourseLanguage?.short}
        flag_file={activeCourseLanguage?.flag_file ?? undefined}
        flag={
          typeof activeCourseLanguage?.flag === "number"
            ? activeCourseLanguage.flag
            : Number.isFinite(Number(activeCourseLanguage?.flag))
              ? Number(activeCourseLanguage?.flag)
              : undefined
        }
        className={styles.trigger}
      />
      <nav className={styles.header_lang_selector}>
        {course_data_active.map((id) => (
          <LanguageButtonSmall
            key={id}
            course={get_course_by_id(id)}
          />
        ))}
      </nav>
    </Dropdown>
  );
}
