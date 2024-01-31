import WordButton from "./word_button";
import styles from "./word_choice.module.css";

export default function WordChoice({ words }) {
  return (
    <div className={styles.word_choice}>
      {words.map((a, i) => (
        <WordButton key={i} {...a} />
      ))}
    </div>
  );
}
