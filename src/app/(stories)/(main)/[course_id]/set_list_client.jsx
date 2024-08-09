"use server";
import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import getUserId from "@/lib/getUserId";
import { sql, cache } from "@/lib/db";
import get_localisation from "@/lib/get_localisation";

function About({ about }) {
  if (!about) return <></>;
  return (
    <div className={styles.set_list_about}>
      <div className={styles.set_title}>About</div>
      <p>{about}</p>
    </div>
  );
}

function Set({ set, done, localisation }) {
  return (
    <ol className={styles.set_content} aria-label={`Set ${set[0].set_id}`}>
      <div className={styles.set_title} aria-hidden={true}>
        {localisation("set_n", { $count: set[0].set_id })}
      </div>
      {set.map((story) => (
        <li key={story.id}>
          <StoryButton story={story} done={done[story.id]} />
        </li>
      ))}
    </ol>
  );
}

async function get_course_done({ course_id, user_id }) {
  return cache(
    async ({ course_id, user_id }) => {
      if (!user_id) return {};
      const done_query = await sql`
SELECT s.id FROM story_done 
JOIN story s on s.id = story_done.story_id WHERE user_id = ${user_id} AND s.course_id = ${course_id} GROUP BY s.id`;
      const done = {};
      for (let d of done_query) {
        done[d.id] = true;
      }

      return done;
    },
    ["get_course_done"],
    { tags: [`course_done_${course_id}_${user_id}`] },
  )({ course_id, user_id });
}

export default async function SetListClient({ course_id, course, about }) {
  let user_id = await getUserId();
  let done = await get_course_done({ course_id, user_id });
  let localisation = await get_localisation(course.from_language_id);

  return (
    <div className={styles.story_list}>
      {about && <About about={about} />}

      {Object.entries(course).map(([key, value]) => (
        <Set key={key} set={value} done={done} localisation={localisation} />
      ))}
    </div>
  );
}
