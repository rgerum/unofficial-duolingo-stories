import styles from "./story_button.module.css";
import Link from "next/link";
import Image from "next/image";

export default function StoryButton({ story, done }) {
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
        style={done ? {} : { background: "#" + story.active_lip }}
      >
        <Image
          src={done ? story.gilded : story.active}
          alt=""
          width={135}
          height={124}
        />
      </div>
      <div className={styles.button_story_text}>{story.name}</div>
    </Link>
  );
}
