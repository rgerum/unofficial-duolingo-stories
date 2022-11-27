import styles from "./main_title.module.css"

export default function MainTitle({children}) {
    return <h1 className={styles.main_title}>{children}</h1>
}