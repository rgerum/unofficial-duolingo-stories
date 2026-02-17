"use client";
import styles from "./story_button.module.css";
import Link from "next/link";
import Image from "next/image";

interface StoryData {
  id: number;
  name: string;
  active: string;
  gilded: string;
  active_lip: string;
}

export default function StoryButton({
  story,
  done,
  listeningMode = false,
}: {
  story?: StoryData;
  done?: boolean;
  listeningMode?: boolean;
}) {
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
      href={listeningMode ? `/story/${story.id}/auto_play` : `/story/${story.id}`}
      onClick={() => {
        if (listeningMode) return;
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem(
            "story_autoplay_ts",
            String(Date.now()),
          );
        }
      }}
    >
      <div
        className={styles.button_story_img}
        data-done={done}
        style={done ? {} : { background: "#" + story.active_lip }}
      >
        {listeningMode ? (
          <span className={styles.audio_badge} aria-label="Listening mode">
            <img
              src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
              alt=""
              aria-hidden="true"
              className={styles.audio_badge_icon}
            />
          </span>
        ) : null}
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
