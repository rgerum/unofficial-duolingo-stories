import styles from "@/components/layout/switch.module.css";

export default function Switch({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <label
      className={styles.switch}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
    >
      <input type="checkbox" checked={checked} readOnly />
      <span className={styles.slider + " " + styles.round} />
    </label>
  );
}
