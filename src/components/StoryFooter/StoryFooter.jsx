import React from "react";
import styles from "./StoryFooter.module.css";
import Button from "../Button";

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
  if (buttonStatus === "wait") {
    return (
      <div className={styles.footer}>
        <div className={styles.width_wrapper}>
          <Button key={"c"} disabled onClick={onClick}>
            Continue
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
            Continue
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
          <Message>You are correct</Message>
        </div>
        <Button key={"c"} onClick={onClick}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export default StoryFooter;
