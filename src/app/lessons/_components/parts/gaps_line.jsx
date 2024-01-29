import styles from "./enter_line.module.css";
import WordButton from "./word_button";

export default function GapsLine({ sentence, words, onClick, state }) {
  let last_pos = 0;
  const parts = [];
  let index = 0;
  const gap_style = {
    0: styles.gap,
    1: styles.gap + " " + styles.wrong,
    2: styles.gap + " " + styles.correct,
  }[state];
  for (let range of sentence.hideRanges) {
    const text_pre = sentence.text.substring(last_pos, range.start);
    if (text_pre.length) parts.push(<span key={index}>{text_pre}</span>);
    const text = sentence.text.substring(range.start, range.end + 1);
    if (text.length)
      parts.push(
        <span key={index + 1} className={gap_style}>
          {text}
        </span>,
      );
    last_pos = range.end + 1;
    index += 2;
  }
  const text_post = sentence.text.substring(last_pos, sentence.text.length);
  if (text_post.length) parts.push(<span key={index}>{text_post}</span>);
  return parts;
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
