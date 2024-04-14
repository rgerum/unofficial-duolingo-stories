import React from "react";
import styles from "./StoryFooter.module.css";
import Button from "../Button";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";

function Message({ children }) {
  return <div className={styles.message}>{children}</div>;
}

function Check() {
  return (
    <div className={styles.check}>
      <span></span>
    </div>
  );
}

function StoryFooter({ buttonStatus, onClick }) {
  const localisation = useLocalisation();

  if (buttonStatus === "finished") {
    return (
      <div className={styles.footer}>
        <div className={styles.width_wrapper}>
          <Button key={"c"} onClick={onClick}>
            {localisation("button_finished") || "finished"}
          </Button>
        </div>
      </div>
    );
  }

  if (buttonStatus === "wait") {
    return (
      <div className={styles.footer}>
        <div className={styles.width_wrapper}>
          <Button key={"c"} disabled onClick={onClick}>
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
          <Button key={"c"} onClick={onClick}>
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
        <Button key={"c"} onClick={onClick}>
          {localisation("button_continue") || "continue"}
        </Button>
      </div>
    </div>
  );
}

export default StoryFooter;
