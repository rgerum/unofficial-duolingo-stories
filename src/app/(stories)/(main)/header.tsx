import styles from "./header.module.css";

export default function Header({ children }: { children: React.ReactNode }) {
  return <header className={styles.header}>{children}</header>;
}
