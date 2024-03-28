import styles from "./Button.module.css";

export default function Button({ children, primary = false, ...delegated }) {
  const className = primary
    ? `${styles.ButtonStyled} ${styles.ButtonBlueStyled}`
    : styles.ButtonStyled;

  return (
    <button className={className} {...delegated}>
      <span className={styles.Wrapper}>{children}</span>
    </button>
  );
}
