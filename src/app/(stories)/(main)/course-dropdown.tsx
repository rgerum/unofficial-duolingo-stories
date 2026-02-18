"use client";
import Link from "next/link";
import Flag from "@/components/ui/flag";
import Dropdown from "@/components/ui/dropdown";
import { useSelectedLayoutSegment } from "next/navigation";
import { CourseData } from "@/app/(stories)/(main)/get_course_data";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

function LanguageButtonSmall({ course }: { course?: CourseData }) {
  /**
   * A button in the language drop down menu (flag + name)
   */
  const language = useQuery(
    api.localization.getLanguageFlagById,
    course ? { languageId: course.learningLanguageId } : "skip",
  );

  if (!course) return null;

  return (
    <Link
      className="flex h-[42px] items-center overflow-hidden whitespace-nowrap border-b border-[var(--header-border)] px-[10px] py-[5px] text-ellipsis no-underline hover:bg-[var(--language-selector-hover-background)]"
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
      <span className="pl-[10px] text-[18px] font-bold">{course.name}</span>
    </Link>
  );
}

export default function CourseDropdown() {
  const course_data = useQuery(api.landing.getPublicCourseList, {});
  const course_data_active = useQuery(
    api.storyDone.getDoneCourseIdsForUser,
    {},
  );

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

  if (!course_data_active || course_data_active.length === 0) return null;

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
        className="mx-4"
      />
      <nav className="!left-[-120px] !w-[300px] max-h-[calc(100vh-55px)]">
        {course_data_active.map((id) => (
          <LanguageButtonSmall key={id} course={get_course_by_id(id)} />
        ))}
      </nav>
    </Dropdown>
  );
}
