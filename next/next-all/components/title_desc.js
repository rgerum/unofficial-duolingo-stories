import styles from "./title_desc.module.css"

export default function TitleDesc({children}) {
    return <p className={styles.title_desc}>{children}</p>
}