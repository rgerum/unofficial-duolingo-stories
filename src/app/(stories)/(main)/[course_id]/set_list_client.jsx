"use client";
import styles from "./set_list.module.css";
import StoryButton from "./story_button";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

function About({ course }) {
  if (!course.about) return <></>;
  return (
    <div className={styles.set_list}>
      <div className={styles.set_title}>About</div>
      <p>{course.about}</p>
    </div>
  );
}

function Set({ set }) {
  return (
    <div key={set[0].set_id} className={styles.set_list}>
      <div className={styles.set_title}>Set {set[0].set_id}</div>
      {set.map((story) => (
        <StoryButton key={story.id} story={story} />
      ))}
    </div>
  );
}

export default function SetListClient({ course_id, course }) {
  return (
    <div className={styles.story_list}>
      <About course={course} />

      {course.sets.map((set) => (
        <Set set={set} />
      ))}
    </div>
  );
}
