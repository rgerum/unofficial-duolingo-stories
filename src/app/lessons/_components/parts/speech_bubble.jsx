import styles from "./speech_bubble.module.css";

export default function SpeechBubble({ children, orientation }) {
  return (
    <div
      className={styles.speech_bubble_container}
      data-orientation={orientation || "left"}
    >
      <div
        className={styles.speech_bubble}
        data-orientation={orientation || "left"}
      >
        {children}
      </div>
    </div>
  );
}
