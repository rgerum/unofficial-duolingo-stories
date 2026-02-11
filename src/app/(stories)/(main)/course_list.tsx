"use client";

import React from "react";
import LanguageButton from "./language_button";
import type { Id } from "@convex/_generated/dataModel";
import type { CourseData } from "./get_course_data";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

import styles from "./course_list.module.css";

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
    <div className={styles.course_list}>
      <hr />
      <div className={styles.course_group_name}>
        {storiesFor}
      </div>
      <ol className={styles.course_list_ol}>
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
      <div className={styles.course_list}>
        <hr />
        <div className={styles.course_group_name}>
          <span className={styles.loading}>Stories for English Speakers</span>
        </div>
        <ol className={styles.course_list_ol}>
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
