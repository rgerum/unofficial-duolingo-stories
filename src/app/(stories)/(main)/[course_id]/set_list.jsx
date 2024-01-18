import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import SetListClient from "./set_list_client";
import { get_course_sets } from "./get_story_data";

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

  const course = await get_course_sets(course_id);
  if (!course) return <div>not found</div>;

  return <SetListClient course_id={course_id} course={course} />;
}
