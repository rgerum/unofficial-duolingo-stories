"use client";

import React from "react";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import Header from "../header";
import StoryButton from "./story_button";
import setListStyles from "./set_list.module.css";
import skeletonStyles from "./story_button.module.css";
import get_localisation_func from "@/lib/get_localisation_func";
import { authClient } from "@/lib/auth-client";

function LoadingTitle() {
  return (
    <Header>
      <h1>
        <span className={skeletonStyles.animated_background}>
          Unofficial Language Duolingo Stories
        </span>
      </h1>
      <p>
        <span className={skeletonStyles.animated_background}>
          Learn Language with 000 community translated Duolingo Stories.
        </span>
      </p>
      <p>
        <span className={skeletonStyles.animated_background}>
          If you want to contribute or discuss the stories, meet us on Discord
        </span>
        <br />
        <span className={skeletonStyles.animated_background}>
          or learn more about the project in our FAQ.
        </span>
      </p>
    </Header>
  );
}

function LoadingSetList() {
  return (
    <div className={setListStyles.story_list}>
      {[...Array(2)].map((_, i) => (
        <ol key={i} className={setListStyles.set_content} aria-label={`Set ${i + 1}`}>
          <div className={setListStyles.set_title} tabIndex={-1} aria-hidden={true}>
            Set {i + 1}
          </div>
          {[...Array(4)].map((_, j) => (
            <li key={j}>
              <StoryButton />
            </li>
          ))}
        </ol>
      ))}
    </div>
  );
}

function About({ about }: { about: string }) {
  if (!about) return <></>;
  return (
    <div className={setListStyles.set_list_about}>
      <div className={setListStyles.set_title}>About</div>
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
      <div className={setListStyles.story_list}>
        {course.about ? <About about={course.about} /> : null}
        {storiesBySet.map((set) => (
          <ol key={set.setId} className={setListStyles.set_content} aria-label={`Set ${set.setId}`}>
            <div className={setListStyles.set_title} aria-hidden={true}>
              {localization("set_n", { $count: `${set.setId}` }) ?? `Set ${set.setId}`}
            </div>
            {set.stories.map((story) => (
              <li key={story.id}>
                <StoryButton story={story} done={doneMap[story.id]} />
              </li>
            ))}
          </ol>
        ))}
      </div>
    </>
  );
}
