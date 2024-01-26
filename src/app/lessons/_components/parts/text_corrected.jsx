import styles from "./text_corrected.module.css";

export default function TextCorrected({ parts }) {
  return parts.map((p, i) => (
    <span
      key={i}
      className={p.added ? styles.removed : p.removed ? styles.corrected : ""}
    >
      {p.text}
    </span>
  ));
}
