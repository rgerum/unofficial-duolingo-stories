"use client";

import Link from "next/link";
import styles from "./language_button.module.css";
import Flag from "@/components/layout/flag";
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
  if (loading) {
    return (
      <div
        className={
          styles.language_select_button + " " + styles.animated_background
        }
      ></div>
    );
  }

  if (!course) return null;

  const language = useQuery(api.localization.getLanguageFlagById, {
    languageId: course.learningLanguageId,
  });

  return (
    <Link
      data-cy={"language_button_big_" + course.short}
      className={styles.language_select_button}
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
      <span className={styles.language_select_button_text}>{course.name}</span>
      <span className={styles.language_story_count}>
        {storiesTemplate?.replaceAll("$count", `${course.count}`) ??
          `${course.count} stories`}
      </span>
    </Link>
  );
}
