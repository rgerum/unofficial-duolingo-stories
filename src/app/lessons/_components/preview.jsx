import styles from "./preview.module.css";

function Part2({ data }) {
  if (data.type === "words") {
    return (
      <div className={styles.words}>
        New words:
        {data.words.map((word, i) => (
          <div className={styles.word} key={i}>
            {word}
          </div>
        ))}
      </div>
    );
  }
  if (data.type === "fill_choice") {
    return (
      <div className={styles.card}>
        <div className={styles.card_title}>{data.type}</div>
        {data.sentence1.text}
        {data.choice.answers.map((word, i) => (
          <div className={styles.word} key={i}>
            {word}
          </div>
        ))}
      </div>
    );
  }
  if (data.type !== "compose" || !data.sentence1) {
    return null;
  }
  return (
    <div className={styles.card}>
      <div className={styles.card_title}>{data.type}</div>
      <div className={styles.card_question}>{data.sentence1.text}</div>
      {data.sentence1.words.map((word, i) => (
        <div className={styles.word} key={i}>
          {word}
        </div>
      ))}
      {data.sentence1.distractors.map((word, i) => (
        <div className={styles.word2} key={i}>
          {word}
        </div>
      ))}
      <div className={styles.card_question2}>{data.sentence2.text}</div>
      {data.sentence2.words.map((word, i) => (
        <div className={styles.word} key={i}>
          {word}
        </div>
      ))}
      {data.sentence2.distractors.map((word, i) => (
        <div className={styles.word2} key={i}>
          {word}
        </div>
      ))}
    </div>
  );
}

export default function Preview({ elements }) {
  return (
    <div className={styles.preview}>
      {elements.map((part, i) => (
        <Part2 key={i} data={part} />
      ))}
    </div>
  );
}
