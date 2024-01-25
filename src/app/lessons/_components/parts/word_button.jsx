import styles from "./word_button.module.css";

export default function WordButton({ word, onClick, status }) {
  return (
    <div className={styles.word_button} data-status={status} onClick={onClick}>
      {word}
    </div>
  );
}
