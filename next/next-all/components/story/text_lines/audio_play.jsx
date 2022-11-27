import React from "react";
import styles from "./audio_play.module.css"

export default function AudioPlay({onClick}) {
    if(onClick === undefined)
        return <></>
    return <img onClick={onClick} src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
                className={styles.loudspeaker} alt="speaker" />;
}