"use client";

import React from "react";
import { api } from "@convex/_generated/api";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";
import Header from "../header";
import StoryButton from "./story_button";
import get_localisation_func from "@/lib/get_localisation_func";

function SetTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-[1/-1] w-full overflow-x-hidden text-center text-[calc(27/16*1rem)] font-bold flex before:flex-1 after:flex-1 items-center before:relative before:right-4 before:-ml-1/2 before:inline-block before:h-[2px] before:w-1/2 before:align-middle before:bg-[var(--overview-hr)] before:content-[''] after:relative after:left-4 after:-mr-1/2 after:inline-block after:h-[2px] after:w-1/2 after:align-middle after:bg-[var(--overview-hr)] after:content-[''] max-[480px]:text-[calc(22/16*1rem)]">
      {children}
    </div>
  );
}

function SetGrid({
  setName,
  children,
}: {
  setName: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ol className="m-0 mx-auto grid max-w-[720px] list-none grid-cols-[repeat(auto-fill,clamp(140px,50%,180px))] justify-center justify-items-center p-0">
      <SetTitle>{setName}</SetTitle>
      {children}
    </ol>
  );
}

function About({ about }: { about: string }) {
  if (!about) return <></>;
  return (
    <div className="mx-auto max-w-[720px]">
      <SetTitle>About</SetTitle>
      <p>{about}</p>
    </div>
  );
}

export default function CoursePageClient({
  course_id,
  preloadedCourse,
}: {
  course_id: string;
  preloadedCourse: Preloaded<typeof api.landing.getPublicCoursePageData>;
}) {
  const course = usePreloadedQuery(preloadedCourse);
  const localizationMap = React.useMemo(() => {
    const data: Record<string, string> = {};
    for (const row of course?.localization ?? []) data[row.tag] = row.text;
    return data;
  }, [course]);
  const localization = React.useMemo(
    () => get_localisation_func(localizationMap),
    [localizationMap],
  );

  const doneStoryIds = useQuery(
    api.storyDone.getDoneStoryIdsForCurrentUserInCourse,
    { courseShort: course_id },
  );
  const doneMap = React.useMemo(() => {
    const done: Record<number, boolean> = {};
    for (const storyId of doneStoryIds ?? []) done[storyId] = true;
    return done;
  }, [doneStoryIds]);

  const storiesBySet = React.useMemo(() => {
    if (!course) return [];
    const grouped: Record<number, typeof course.stories> = {};
    for (const story of course.stories) {
      if (!grouped[story.set_id]) grouped[story.set_id] = [];
      grouped[story.set_id].push(story);
    }
    return Object.entries(grouped)
      .map(([setId, stories]) => ({
        setId: Number.parseInt(setId, 10),
        stories: stories.sort((a, b) => a.set_index - b.set_index),
      }))
      .sort((a, b) => a.setId - b.setId);
  }, [course]);

  if (!course) {
    return (
      <Header>
        <h1>Course not found.</h1>
      </Header>
    );
  }

  return (
    <>
      <Header>
        <h1>
          {localization("course_page_title", {
            $language: course.learning_language_name,
          }) ?? `${course.learning_language_name} Duolingo Stories`}
        </h1>
        <p>
          {localization("course_page_sub_title", {
            $language: course.learning_language_name,
            $count: `${course.count}`,
          }) ??
            `Learn ${course.learning_language_name} with ${course.count} stories.`}
        </p>
        <p className="[&_a]:underline [&_a]:underline-offset-2">
          {localization("course_page_discuss", {}, [
            "https://discord.gg/4NGVScARR3",
            "/faq",
          ])}
        </p>
      </Header>
      <div>
        {course.about ? <About about={course.about} /> : null}
        {storiesBySet.map((set) => (
          <SetGrid
            key={set.setId}
            setName={
              localization("set_n", { $count: `${set.setId}` }) ??
              `Set ${set.setId}`
            }
          >
            {set.stories.map((story) => (
              <li key={story.id}>
                <StoryButton story={story} done={doneMap[story.id]} />
              </li>
            ))}
          </SetGrid>
        ))}
      </div>
    </>
  );
}
