import styles from "./stats_element.module.css"
import Flag from "../layout/flag";
import React from "react";

export default function StatsElement({lang1, lang2, count, count_old, max_count}) {
    let max_height = 100;
    count_old = count_old || 0;
    return <div className={styles.language}>
        <div className={styles.bar_container} style={{height: max_height+"px"}}>
        <div className={styles.bar} style={{minHeight: (count/max_count*max_height)+"px" }}></div>
        <div className={styles.bar2} style={{minHeight: (count_old/max_count*max_height)+"px" }}></div>
        </div>
        <br/>
        <span className={styles.count}>{count}</span>
        <span className={styles.count2}>{count_old}</span>
        <div className={styles.flagBox}>
            <Flag iso={lang1.short} flag_file={lang1.flag_file} width={40}/>
            <Flag iso={lang2.short} flag_file={lang2.flag_file} width={30}/>
        </div>
        <span className={styles.languageBox}>
            <span className={styles.learningLanguage}>{lang1.name}</span><br/>
            <span className={styles.fromLanguage}>(from {lang2.name})</span>
        </span>
    </div>
}