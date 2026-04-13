"use client";
import Link from "@/lib/router";
import LanguageFlag from "@/components/ui/language-flag";
import { useSelectedLayoutSegment } from "@/lib/router";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn";

type CourseData = {
  id: number;
  short: string;
  name: string;
  learningLanguageId: string;
};

function LanguageButtonSmall({ course }: { course?: CourseData }) {
  /**
   * A button in the language drop down menu (flag + name)
   */
  if (!course) return null;

  return (
    <DropdownMenuItem asChild>
      <Link
        className="flex h-[42px] items-center overflow-hidden whitespace-nowrap px-[10px] py-[5px] no-underline"
        href={`/${course.short}`}
        data-cy="button_lang_dropdown"
      >
        <LanguageFlag languageId={course.learningLanguageId} width={40} />
        <span className="min-w-0 pl-[10px] overflow-hidden text-ellipsis text-[18px] font-bold whitespace-nowrap">
          {course.name}
        </span>
      </Link>
    </DropdownMenuItem>
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

  if (!course_data_active || course_data_active.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="mx-4 flex items-center justify-center rounded-[14px] p-0 outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--button-background)] focus-visible:ring-offset-2"
          aria-label="Open language menu"
        >
          <LanguageFlag languageId={course?.learningLanguageId} width={40} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={10}
        className="w-[240px] overflow-visible"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-[12px] left-1/2 h-[13px] w-[28px] -translate-x-1/2 overflow-hidden"
        >
          <svg
            viewBox="0 0 28 13"
            className="absolute inset-0 h-[13px] w-[28px]"
            aria-hidden="true"
          >
            <path
              d="M14 0.5 Q15.5 0.5 16.5 1.7 L28 13 H0 L11.5 1.7 Q12.5 0.5 14 0.5 Z"
              fill="var(--header-border)"
            />
            <path
              d="M14 1.5 Q15 1.5 15.8 2.4 L26 13 H2 L12.2 2.4 Q13 1.5 14 1.5 Z"
              fill="var(--body-background)"
            />
          </svg>
        </div>
        <nav className="max-h-[calc(100vh-55px)] overflow-y-auto">
          {course_data_active.map((id) => (
            <LanguageButtonSmall key={id} course={get_course_by_id(id)} />
          ))}
        </nav>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
