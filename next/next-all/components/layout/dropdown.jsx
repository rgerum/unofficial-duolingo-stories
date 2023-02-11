import styles from "./dropdown.module.css"
import React from "react";

export default function Dropdown({children}) {
    return <div className={styles.dropdown}>
        <div className={styles.diamond_wrap}>
            <div className={styles.diamond}></div>
        </div>
        {children}
    </div>
}