import styles from "./enter_line.module.css";
import WordButton from "./word_button";

export default function EnterLine({ text, input, onChange, words }) {
  if (text) {
    return <div className={styles.enter_line}>{text}</div>;
  }
  if (!words) {
    return (
      <div className={styles.enter_line}>
        <input value={input} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div className={styles.enter_line}>
      {words.map((a, i) => (
        <WordButton key={i} {...a} />
      ))}
    </div>
  );
}
