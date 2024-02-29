import styles from "./button.module.css";

export default function Button({ children, variant, ...delegated }) {
  return (
    <button
      className={styles.button + " " + (variant && styles.blue)}
      {...delegated}
    >
      {children}
    </button>
  );
}
