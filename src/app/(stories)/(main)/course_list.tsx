"use client";

import React from "react";
import LanguageButton from "./language_button";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseData } from "./get_course_data";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

function getCourseGroups(courses: CourseData[]) {
  const english = courses.find((course) => course.from_language_name === "English");
  const otherIds = Array.from(
    new Set(
      courses
        .filter((course) => course.from_language_name !== "English")
        .map((course) => course.fromLanguageId),
    ),
  );
  const englishIds = english ? [english.fromLanguageId] : [];
  return [...englishIds, ...otherIds];
}

function LanguageGroup({
  name,
  id,
  courses,
  startIndex,
}: {
  name: string;
  id: Id<"languages">;
  courses: CourseData[];
  startIndex: number;
}) {
  const localisationRows = useQuery(api.localization.getLocalizationWithEnglishFallback, {
    languageId: id,
  });
  const storiesFor =
    localisationRows?.find((entry) => entry.tag === "stories_for")?.text ?? "Stories for";
  const nStoriesTemplate =
    localisationRows?.find((entry) => entry.tag === "n_stories")?.text ?? "$count stories";

  if (!courses) return <>no list {name}</>;

  const coursesList = courses.filter((course) => course.fromLanguageId === id);

  return (
    <div className="flex flex-col">
      <hr className="my-0 mt-[30px] mb-[22px] h-0 w-full border-0 border-t-2 border-[var(--overview-hr)]" />
      <div className="mb-[14px] w-full pl-[5px] text-[calc(24/16*1rem)] font-bold">{storiesFor}</div>
      <ol className="grid w-full list-none grid-cols-[repeat(auto-fill,minmax(min(190px,calc(50%-12px)),1fr))] gap-3 p-0">
        {coursesList.map((course, index) => (
          <li key={course.id}>
            <LanguageButton
              course={course}
              storiesTemplate={nStoriesTemplate}
              eagerFlagImage={startIndex + index < 8}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function CourseListInner({
  tag,
  loading,
}: {
  tag?: string;
  loading?: boolean | undefined;
}) {
  const courses = useQuery(api.landing.getPublicCourseList, {});

  if (loading) {
    return (
      <div className="flex flex-col">
        <hr className="my-0 mt-[30px] mb-[22px] h-0 w-full border-0 border-t-2 border-[var(--overview-hr)]" />
        <div className="mb-[14px] w-full pl-[5px] text-[calc(24/16*1rem)] font-bold">
          <span className="inline-block w-full max-w-[320px] animate-pulse rounded bg-slate-200/90 text-transparent">
            Stories for English speakers
          </span>
        </div>
        <ol className="grid w-full list-none grid-cols-[repeat(auto-fill,minmax(min(190px,calc(50%-12px)),1fr))] gap-3 p-0">
          {[...Array(10)].map((_, i) => (
            <li key={i}>
              <LanguageButton loading={true} />
            </li>
          ))}
        </ol>
      </div>
    );
  }

  if (!courses) return <CourseListInner loading={true} tag={tag} />;

  const courseGroups = getCourseGroups(courses);
  let startIndex = 0;
  const groups = courseGroups
    .map((groupId) => {
      const groupCourse = courses.find(
        (course) => course.fromLanguageId === groupId,
      );
      if (!groupCourse) return null;
      const groupCount = courses.filter(
        (course) => course.fromLanguageId === groupId,
      ).length;
      const currentStartIndex = startIndex;
      startIndex += groupCount;

      return {
        groupId,
        groupCourse,
        startIndex: currentStartIndex,
      };
    })
    .filter(Boolean) as {
    groupId: Id<"languages">;
    groupCourse: CourseData;
    startIndex: number;
  }[];

  return (
    <>
      {groups.map(({ groupId, groupCourse, startIndex }) => {
        return (
          <LanguageGroup
            key={groupId}
            name={groupCourse.from_language_name}
            id={groupId}
            courses={courses}
            startIndex={startIndex}
          />
        );
      })}
    </>
  );
}

export default function CourseList({ tag }: { tag: string }) {
  return <CourseListInner tag={tag} />;
}
