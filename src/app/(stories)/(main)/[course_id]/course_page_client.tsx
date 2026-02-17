"use client";

import React from "react";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import Header from "../header";
import StoryButton from "./story_button";
import get_localisation_func from "@/lib/get_localisation_func";
import { authClient } from "@/lib/auth-client";

function SetTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 flex w-full items-center justify-center gap-4 px-[8vw] text-center text-[calc(27/16*1rem)] font-bold max-[1200px]:px-10 max-[480px]:px-0 max-[480px]:text-[calc(22/16*1rem)]">
      <span className="h-[2px] flex-1 bg-[var(--overview-hr)] max-[480px]:hidden" />
      <span>{children}</span>
      <span className="h-[2px] flex-1 bg-[var(--overview-hr)] max-[480px]:hidden" />
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
    <div className="w-full">
      <SetTitle>{setName}</SetTitle>
      <ol className="mx-auto mb-[14px] grid max-w-[720px] list-none grid-cols-[repeat(auto-fill,clamp(140px,50%,180px))] justify-center justify-items-center gap-0 p-0">
        {children}
      </ol>
    </div>
  );
}

function LoadingTitle() {
  return (
    <Header>
      <h1>
        <span className="inline-block animate-pulse rounded bg-slate-200 px-3 text-transparent">
          Unofficial Language Duolingo Stories
        </span>
      </h1>
      <p>
        <span className="inline-block animate-pulse rounded bg-slate-200 px-3 text-transparent">
          Learn Language with 000 community translated Duolingo Stories.
        </span>
      </p>
      <p>
        <span className="inline-block animate-pulse rounded bg-slate-200 px-3 text-transparent">
          If you want to contribute or discuss the stories, meet us on Discord
        </span>
        <br />
        <span className="inline-block animate-pulse rounded bg-slate-200 px-3 text-transparent">
          or learn more about the project in our FAQ.
        </span>
      </p>
    </Header>
  );
}

function LoadingSetList() {
  return (
    <div className="mt-6 flex flex-col gap-[18px]">
      {[...Array(2)].map((_, i) => (
        <SetGrid key={i} setName={`Set ${i + 1}`}>
          {[...Array(4)].map((_, j) => (
            <li key={j}>
              <StoryButton />
            </li>
          ))}
        </SetGrid>
      ))}
    </div>
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

export default function CoursePageClient({ courseId }: { courseId: string }) {
  const course = useQuery(api.landing.getPublicCoursePageData, { short: courseId });
  const localizationMap = React.useMemo(() => {
    const data: Record<string, string> = {};
    for (const row of course?.localization ?? []) data[row.tag] = row.text;
    return data;
  }, [course]);
  const localization = React.useMemo(
    () => get_localisation_func(localizationMap),
    [localizationMap],
  );

  const { data: session } = authClient.useSession();
  const rawUserId = (session?.user as { userId?: string | number } | undefined)?.userId;
  const legacyUserId =
    typeof rawUserId === "number"
      ? rawUserId
      : Number.parseInt(rawUserId ?? "", 10);

  const doneStoryIds = useQuery(
    api.storyDone.getDoneStoryIdsForCourse,
    course && Number.isFinite(legacyUserId)
      ? { legacyCourseId: course.id, legacyUserId }
      : "skip",
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

  if (course === undefined) {
    return (
      <>
        <LoadingTitle />
        <LoadingSetList />
      </>
    );
  }

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
        <p>
          {localization("course_page_discuss", {}, [
            "https://discord.gg/4NGVScARR3",
            "/faq",
          ])}
        </p>
      </Header>
      <div className="mt-6 flex flex-col gap-[18px]">
        {course.about ? <About about={course.about} /> : null}
        {storiesBySet.map((set) => (
          <SetGrid
            key={set.setId}
            setName={localization("set_n", { $count: `${set.setId}` }) ?? `Set ${set.setId}`}
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
