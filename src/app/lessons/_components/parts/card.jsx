import styles from "./card.module.css";
import Link from "next/link";

export default function Card({ children, state, active, current, total }) {
  const classnames = {
    0: styles.card,
    2: styles.card_correct,
    1: styles.card_incorrect,
  };

  if (active === 10) {
    return <div>{children}</div>;
  }
  return (
    <div className={styles.card_parent}>
      <div className={classnames[state]} data-active={active}>
        <Link href={"/lessons"} className={styles.card_close}></Link>
        <span>
          {current + 1} / {total}
        </span>
        {children}
      </div>
    </div>
  );
}

export function CardTitle({ children }) {
  return <div className={styles.card_title}>{children}</div>;
}

export function CardQuestion({ children, audio_only }) {
  if (audio_only) {
    return (
      <div className={styles.card_question} style={{ opacity: 0.2 }}>
        {children}
      </div>
    );
  }
  return <div className={styles.card_question}>{children}</div>;
}

export function CardCheck({ children, onClick }) {
  return (
    <button className={styles.check} onClick={onClick}>
      {children}
    </button>
  );
}

export function CardFalse({ children }) {
  return (
    <>
      <div className={styles.card_wrong_answer}>You wrote:</div>
      {children}
    </>
  );
}

export function CardCorrect({ children }) {
  return (
    <>
      <div className={styles.card_right_answer}>Correct:</div>
      {children}
    </>
  );
}
