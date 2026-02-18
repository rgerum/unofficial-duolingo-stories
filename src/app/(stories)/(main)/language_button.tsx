"use client";

import Link from "next/link";
import Flag from "@/components/ui/flag";

export interface LandingCourseButtonData {
  id: number;
  short: string;
  name: string;
  count: number;
  learningLanguage: {
    short: string;
    flag?: number | string;
    flag_file?: string;
  };
}

export default function LanguageButton({
  course,
  storiesTemplate,
  loading,
  eagerFlagImage,
}: {
  course?: LandingCourseButtonData;
  storiesTemplate?: string;
  loading?: boolean;
  eagerFlagImage?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex h-[210px] cursor-default flex-col items-center justify-center rounded-2xl border-2 border-[var(--overview-hr)] bg-[var(--body-background)] p-0 text-center">
        <div className="h-full w-full animate-pulse rounded-2xl bg-slate-200/80" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <Link
      data-cy={"language_button_big_" + course.short}
      className="relative flex h-[210px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-[var(--overview-hr)] bg-[var(--body-background)] p-0 text-center no-underline transition hover:brightness-90"
      href={`/${course.short}`}
      prefetch={false}
    >
      <Flag
        iso={course.learningLanguage.short}
        flag={
          typeof course.learningLanguage.flag === "number"
            ? course.learningLanguage.flag
            : Number.isFinite(Number(course.learningLanguage.flag))
              ? Number(course.learningLanguage.flag)
              : undefined
        }
        flag_file={course.learningLanguage.flag_file ?? undefined}
        loading={eagerFlagImage ? "eager" : "lazy"}
      />
      <span className="mt-[10px] block text-[calc(19/16*1rem)] font-bold text-[var(--text-color-dim)]">
        {course.name}
      </span>
      <span className="text-[calc(15/16*1rem)] text-[var(--text-color-dim)] opacity-50">
        {storiesTemplate?.replaceAll("$count", `${course.count}`) ??
          `${course.count} stories`}
      </span>
    </Link>
  );
}
