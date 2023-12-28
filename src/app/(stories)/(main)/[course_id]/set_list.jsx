import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import SetListClient from "./set_list_client";
import { unstable_cache } from "next/cache";
import { sql } from "lib/db";

const get_course_done = async (course_id, username) => {
  const done_query =
    await sql`SELECT s.id FROM story_done JOIN story s on s.id = story_done.story_id WHERE user_id = (SELECT id FROM "user" WHERE username = ${username} LIMIT 1) AND s.course_id = (SELECT id FROM course WHERE short = ${course_id} LIMIT 1) GROUP BY s.id`;
  const done = {};
  for (let d of done_query) {
    done[d.id] = true;
  }

  return done;
};

const get_course = unstable_cache(
  async (course_id) => {
    const course = (
      await sql`
        SELECT course.id, course.short, course.about, 
        course.from_language as from_language_id,
        l1.short AS from_language, l1.name AS from_language_name, l1.flag_file AS from_language_flag_file, l1.flag AS from_language_flag,
        l2.short AS learning_language, l2.name AS learning_language_name, l2.flag_file AS learning_language_flag_file, l2.flag AS learning_language_flag     
        FROM course 
        LEFT JOIN language l1 ON l1.id = course.from_language
        LEFT JOIN language l2 ON l2.id = course.learning_language
        WHERE course.short = ${course_id} LIMIT 1
        `
    )[0];

    if (!course) return null;

    const res = await sql`
        SELECT story.id, story.set_id, story.set_index, story.name, story.course_id,
        i.active, i.active_lip, i.gilded, i.gilded_lip
        FROM story
        JOIN image i on story.image = i.id
        WHERE story.public AND NOT story.deleted AND story.course_id = (SELECT c.id FROM course c WHERE c.short = ${course_id} LIMIT 1)
        ORDER BY set_id, set_index;
        `;
    if (res.length === 0) return { ...course, sets: [], count: 0 };

    // group into sets
    let set = -1;
    let sets = [];
    for (let d of res) {
      if (set !== d.set_id) {
        set = d.set_id;
        sets.push([]);
      }
      sets[sets.length - 1].push(d);
    }

    let count = 0;
    for (let set of sets) count += set.length;

    return { ...course, sets: sets, count: count };
  },
  ["get_courseXXXXY"],
);

export default async function SetList({ course_id }) {
  if (!course_id) {
    return (
      <div className={styles.story_list}>
        {[...Array(2)].map((d, i) => (
          <div key={i} className={styles.set_list}>
            <div className={styles.set_title}>Set {i + 1}</div>
            {[...Array(4)].map((d, i) => (
              <StoryButton key={i} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const course = await get_course(course_id);
  if (!course) return <div>not found</div>;

  return <SetListClient course_id={course_id} course={course} />;
}
