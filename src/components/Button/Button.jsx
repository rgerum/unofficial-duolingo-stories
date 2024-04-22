import styles from "./Button.module.css";

export default function Button({
  children,
  disabled,
  primary = false,
  ...delegated
}) {
  const className = primary
    ? `${styles.ButtonStyled} ${styles.ButtonBlueStyled}`
    : styles.ButtonStyled;

  if (disabled) {
    return (
      <button
        className={`${styles.ButtonStyled} ${styles.ButtonDisabled}`}
        disabled
        {...delegated}
      >
        <span className={styles.Wrapper}>{children}</span>
      </button>
    );
  }

  return (
    <button className={className} {...delegated}>
      <span className={styles.Wrapper}>{children}</span>
    </button>
  );
}
