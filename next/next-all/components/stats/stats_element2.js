import styles from "./stats_element2.module.css"
import Flag from "../layout/flag";
import React from "react";

export default function StatsElement2({course}) {
    let c = course;
    let lang1 = course.learningLanguage;
    let lang2 = course.fromLanguage;
    return <div className={styles.statsBox}>
        <div className={styles.box1}>
            <div className={styles.flagBox}>
                <Flag iso={lang1.short} flag_file={lang1.flag_file} width={40}/>
                <Flag iso={lang2.short} flag_file={lang2.flag_file} width={30}/>
            </div>
            <span className={styles.languageBox}>
                <span className={styles.learningLanguage}>{lang1.name}</span><br/>
                <span className={styles.fromLanguage}>(from {lang2.name})</span>
            </span>
        </div>
        <table className={styles.box2}>
            <StatElement name={"Stories Published"} prop={c.stories_published} />
            <StatElement name={"Stories Read"} prop={c.stories_read} />
            <StatElement name={"Active Users"} prop={c.active_users} />
            <StatElement name={"Active Stories"} prop={c.active_stories} />
        </table>

    </div>
}

function StatElement({name, prop}) {
    let increase = ((prop?.count || 0)/(prop?.count_old || 0) - 1) * 100;
    let increaseClass = (increase>0) ? (styles.increasePlus+" "+styles.increase) : (styles.increaseMinus+" "+styles.increase);
    if(!prop?.count_old)
        increaseClass = (styles.increaseHidden+" "+styles.increase);
    let max_width = 100;
    return <tr className={styles.stat}><td className={styles.statName}>{name}</td>
        <td className={styles.statCount}>{prop?.count || 0}</td>
        <td className={increaseClass}>{increase.toFixed(0)}%</td>
        <td className={styles.countOld}>({prop?.count_old || 0})</td>
        <td>
            <div className={styles.bar_container} style={{width: (max_width)+"px"}}>
                <div className={styles.bar} style={{width: (prop?.count/prop?.max_count*max_width)+"px"}}></div>
                <div className={styles.bar2} style={{width: (prop?.count_old/prop?.max_count*max_width)+"px"}}></div>
            </div>
        </td>
        <td>{prop?.rank ? `#${prop?.rank || 0}`: ""}</td>
        <td className={styles.rankOld}>{prop?.rank_old ? `(#${prop?.rank_old || 0})`: ""}</td>
    </tr>
}