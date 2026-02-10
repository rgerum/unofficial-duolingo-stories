"use server";
import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import getUserId from "@/lib/getUserId";
import { cache } from "@/lib/db";
import get_localisation, { LocalisationFunc } from "@/lib/get_localisation";
import { CourseData } from "@/app/(stories)/(main)/get_course_data";
import { StoryData } from "@/app/(stories)/(main)/[course_id]/get_story_data";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@convex/_generated/api";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "";
if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL/CONVEX_URL");
}
const convex = new ConvexHttpClient(convexUrl);

function About({ about }: { about: string }) {
  if (!about) return <></>;
  return (
    <div className={styles.set_list_about}>
      <div className={styles.set_title}>About</div>
      <p>{about}</p>
    </div>
  );
}

function Set({
  set,
  done,
  localisation,
}: {
  set: StoryData[];
  done: Record<number, boolean>;
  localisation: LocalisationFunc;
}) {
  return (
    <ol className={styles.set_content} aria-label={`Set ${set[0].set_id}`}>
      <div className={styles.set_title} aria-hidden={true}>
        {localisation("set_n", { $count: `${set[0].set_id}` })}
      </div>
      {set.map((story) => (
        <li key={story.id}>
          <StoryButton story={story} done={done[story.id]} />
        </li>
      ))}
    </ol>
  );
}

async function get_course_done({
  course_id,
  user_id,
}: {
  course_id: number;
  user_id?: number;
}) {
  return cache(
    async ({ course_id, user_id }) => {
      if (!user_id) return {};
      const done_query = await convex.query(api.storyDone.getDoneStoryIdsForCourse, {
        legacyCourseId: course_id,
        legacyUserId: user_id,
      });
      const done: Record<number, boolean> = {};
      for (let storyId of done_query) {
        done[storyId] = true;
      }

      return done;
    },
    ["get_course_done"],
    { tags: [`course_done_${course_id}_${user_id}`] },
  )({ course_id, user_id });
}

export default async function SetListClient({
  course_data,
  course_id,
  course,
  about,
}: {
  course_data: CourseData;
  course_id: number;
  course: Record<string, StoryData[]>;
  about: string;
}) {
  let user_id = await getUserId();
  let done = await get_course_done({ course_id, user_id });
  let localisation = await get_localisation(course_data.from_language);

  return (
    <div className={styles.story_list}>
      {about && <About about={about} />}

      {Object.entries(course).map(([key, value]) => (
        <Set key={key} set={value} done={done} localisation={localisation} />
      ))}
    </div>
  );
}
