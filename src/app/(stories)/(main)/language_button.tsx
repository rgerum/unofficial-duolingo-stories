"use client";

import Link from "next/link";
import Flag from "@/components/ui/flag";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import type { CourseData } from "./get_course_data";

export default function LanguageButton({
  course,
  storiesTemplate,
  loading,
  eagerFlagImage,
}: {
  course?: Pick<CourseData, "short" | "name" | "count" | "learningLanguageId">;
  storiesTemplate?: string;
  loading?: boolean;
  eagerFlagImage?: boolean;
}) {
  const language = useQuery(
    api.localization.getLanguageFlagById,
    course ? { languageId: course.learningLanguageId } : "skip",
  );

  if (loading) {
    return (
      <div
        className="flex h-[210px] cursor-default flex-col items-center justify-center rounded-2xl border-2 border-[var(--overview-hr)] bg-[var(--body-background)] p-0 text-center"
      >
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
        iso={language?.short}
        flag={
          typeof language?.flag === "number"
            ? language.flag
            : Number.isFinite(Number(language?.flag))
              ? Number(language?.flag)
              : undefined
        }
        flag_file={language?.flag_file ?? undefined}
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
