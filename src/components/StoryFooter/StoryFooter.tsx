import React from "react";
import styles from "./StoryFooter.module.css";
import Button from "../Button";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";

function Message({ children }: { children: React.ReactNode }) {
  return <div className={styles.message}>{children}</div>;
}

function Check() {
  return (
    <div className={styles.check}>
      <span></span>
    </div>
  );
}

function StoryFooter({
  buttonStatus,
  onClick,
  onBackToOverview,
  finishedLabel,
  nextStoryPreview,
  learningLanguageName,
  showFinishedPrimaryAction = true,
}: {
  buttonStatus: string;
  onClick: () => void;
  onBackToOverview?: () => void | Promise<void>;
  finishedLabel?: string;
  nextStoryPreview?: {
    id: number;
    title: string;
    active: string;
    gilded: string;
  } | null;
  learningLanguageName?: string;
  showFinishedPrimaryAction?: boolean;
}) {
  const localisation = useLocalisation();

  const onContinueClick = React.useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("story_autoplay_ts", String(Date.now()));
    }
    onClick();
  }, [onClick]);

  if (buttonStatus === "...") {
    return (
      <div className={styles.footer}>
        <div className={styles.width_wrapper}>
          <Button key={"c"} onClick={onContinueClick}>
            {"..."}
          </Button>
        </div>
      </div>
    );
  }

  if (buttonStatus === "finished") {
    return (
      <div className={styles.footer}>
        <div
          className={`${styles.width_wrapper} ${styles.width_wrapper_finished}`}
        >
          <button
            type="button"
            className={styles.back_button}
            onClick={() => {
              void onBackToOverview?.();
            }}
          >
            Back to overview
          </button>
          <div className={styles.finished_center}>
            {nextStoryPreview ? (
              <div className={styles.next_preview}>
                <div className={styles.next_preview_label}>Up next</div>
                <div className={styles.next_preview_card}>
                  <div className={styles.next_preview_image}>
                    <img src={nextStoryPreview.active} alt="" />
                  </div>
                  <div className={styles.next_preview_copy}>
                    <div className={styles.next_preview_title}>
                      {nextStoryPreview.title}
                    </div>
                    <div className={styles.next_preview_subtitle}>
                      {learningLanguageName
                        ? `Continue in ${learningLanguageName}`
                        : "Next story in this course"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.next_preview_empty} />
            )}
          </div>
          {showFinishedPrimaryAction ? (
            <Button key={"c"} onClick={onContinueClick}>
              {finishedLabel ?? localisation("button_finished") ?? "finished"}
            </Button>
          ) : (
            <div className={styles.finished_action_spacer} />
          )}
        </div>
      </div>
    );
  }

  if (buttonStatus === "wait") {
    return (
      <div className={styles.footer}>
        <div className={styles.width_wrapper}>
          <Button key={"c"} disabled onClick={onContinueClick}>
            {localisation("button_continue") || "continue"}
          </Button>
        </div>
      </div>
    );
  }
  if (buttonStatus !== "right") {
    return (
      <div className={styles.footer}>
        <div className={styles.width_wrapper}>
          <Button key={"c"} onClick={onContinueClick}>
            {localisation("button_continue") || "continue"}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.footer + " " + styles.footer_right}>
      <div className={styles.width_wrapper}>
        <div className={styles.inner}>
          <Check />
          <Message>
            {localisation("story_correct") || "You are correct"}
          </Message>
        </div>
        <Button key={"c"} onClick={onContinueClick}>
          {localisation("button_continue") || "continue"}
        </Button>
      </div>
    </div>
  );
}

export default StoryFooter;
