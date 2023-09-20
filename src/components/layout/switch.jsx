import styles from "./switch.module.css";

export default function Switch({ checked, onClick }) {
  return (
    <label
      className={styles.switch}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <input type="checkbox" checked={checked} readOnly="readOnly" />
      <span className={styles.slider + " " + styles.round} />
    </label>
  );
}
