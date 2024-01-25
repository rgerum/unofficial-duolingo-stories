import WordButton from "./word_button";
import styles from "./word_column.module.css";

export default function WordColumn({ words }) {
  return (
    <div className={styles.word_column}>
      {words.map((a, i) => (
        <WordButton key={i} {...a} />
      ))}
    </div>
  );
}

export function WordColumnGroup({ children }) {
  return <div className={styles.word_column_group}>{children}</div>;
}
