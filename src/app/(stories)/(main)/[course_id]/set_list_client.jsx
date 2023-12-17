"use server";
import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import getUserId from "lib/getUserId";
import { sql } from "lib/db";
import get_localisation from "lib/get_localisation";

function About({ course }) {
  if (!course.about) return <></>;
  return (
    <div className={styles.set_list}>
      <div className={styles.set_title}>About</div>
      <p>{course.about}</p>
    </div>
  );
}

function Set({ set, done, localisation }) {
  return (
    <div key={set[0].set_id} className={styles.set_list}>
      <div className={styles.set_title}>
        {localisation("set_n", { $count: set[0].set_id }) ||
          `Set ${set[0].set_id}`}
      </div>
      {set.map((story) => (
        <StoryButton key={story.id} story={story} done={done[story.id]} />
      ))}
    </div>
  );
}

async function get_course_done({ course_id, user_id }) {
  const done_query = await sql`
SELECT s.id FROM story_done 
JOIN story s on s.id = story_done.story_id WHERE user_id = ${user_id} AND s.course_id = (SELECT c.id FROM course c WHERE c.short = ${course_id} LIMIT 1) GROUP BY s.id`;
  const done = {};
  for (let d of done_query) {
    done[d.id] = true;
  }

  return done;
}

export default async function SetListClient({ course_id, course }) {
  let user_id = await getUserId();
  let done = await get_course_done({ course_id, user_id });
  let localisation = await get_localisation(course.from_language_id);

  return (
    <div className={styles.story_list}>
      <About course={course} />

      {course.sets.map((set) => (
        <Set
          key={set[0].set_id}
          set={set}
          done={done}
          localisation={localisation}
        />
      ))}
    </div>
  );
}
