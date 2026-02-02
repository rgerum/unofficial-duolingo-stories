"use server";
import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import getUserId from "@/lib/getUserId";
import get_localisation, { LocalisationFunc } from "@/lib/get_localisation";
import { CourseData } from "@/app/(stories)/(main)/get_course_data_convex";
import { StoryData, get_course_done } from "./get_story_data_convex";

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

export default async function SetListClient({
  course_data,
  course_short,
  course,
  about,
}: {
  course_data: CourseData;
  course_short: string;
  course: Record<string, StoryData[]>;
  about: string;
}) {
  let user_id = await getUserId();
  let done = await get_course_done({ courseShort: course_short, user_id });
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
