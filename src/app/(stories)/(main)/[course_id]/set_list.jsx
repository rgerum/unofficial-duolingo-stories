import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import SetListClient from "./set_list_client";
import { get_course_sets } from "./get_story_data";
import { get_course } from "../get_course_data";

export default async function SetList({ course_id }) {
  if (!course_id) {
    return (
      <div className={styles.story_list}>
        {[...Array(2)].map((d, i) => (
          <ol
            key={i}
            className={styles.set_content}
            aria-label={`Set ${i + 1}`}
          >
            <div className={styles.set_title} tabIndex="-1" aria-hidden={true}>
              Set {i + 1}
            </div>
            {[...Array(4)].map((d, i) => (
              <li key={i}>
                <StoryButton />
              </li>
            ))}
          </ol>
        ))}
      </div>
    );
  }

  const course_data = await get_course(course_id);
  const course = await get_course_sets(course_id);
  if (!course) return <div>not found</div>;

  return (
    <SetListClient
      course_id={course_data.id}
      course={course}
      about={course_data.about}
    />
  );
}
