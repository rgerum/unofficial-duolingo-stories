import styles from "./enter_line.module.css";
import WordButton from "./word_button";

export default function GapsLine({ sentence, words, onClick }) {
  return (
    <div className={styles.enter_line}>
      {sentence.map((a, i) => (
        <>
          <span>{a}</span>
          {words[i] ? (
            <WordButton key={i} word={words[i]} onClick={() => onClick(i)} />
          ) : (
            <span className={styles.gap}></span>
          )}
        </>
      ))}
    </div>
  );
}
