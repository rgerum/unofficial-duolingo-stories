"use client";
import styles from "./story_button.module.css";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function StoryButton({ story }) {
  const {
    data: dones,
    error,
    isLoading,
  } = useSWR(story?.course_id ? `${story.course_id}/get_done` : null, fetcher);
  console.log(
    "swr",
    story?.course_id ? `${story.course_id}/get_done` : null,
    story,
    dones,
  );
  let done = dones ? dones[story.id] : false;

  if (!story) {
    return (
      <div className={styles.button_story_parent}>
        <div
          className={styles.button_story_img + " " + styles.animated_background}
          data-done={false}
        ></div>
        <div
          className={
            styles.button_story_text + " " + styles.animated_background
          }
        >
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        </div>
      </div>
    );
  }

  return (
    <Link
      data-cy={"story_button_" + story.id}
      className={styles.button_story_parent}
      href={`/story/${story.id}`}
    >
      <div
        className={styles.button_story_img}
        data-done={done}
        style={done ? {} : { background: "#" + story.activeLip }}
      >
        <img src={done ? story.gilded : story.active} alt="" />
      </div>
      <div className={styles.button_story_text}>{story.name}</div>
    </Link>
  );
}
