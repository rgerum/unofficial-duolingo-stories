import React from "react";
import styles from "./story_header.module.css"
import Link from "next/link";

export default function StoryHeader({course, progress, length}) {
    return <div id={styles.header}>
        <div id={styles.header_icon}><Link id={styles.quit} href={"/"+course} data-cy="quit"/></div>
        <div id={styles.progress}>
            <div id={styles.progress_inside} style={{width: progress/length*100+"%"}}>
                <div id={styles.progress_highlight}></div>
            </div>
        </div>
    </div>
}