import React from "react";
import styles from "./finish_page.module.css"


export default function FinishedPage({story}) {
    /* The page at the end of the story. */
    return <div id="finishedPage" className={styles.page_finished} data-hidden={false}>
        <div>
            <div className={styles.finished_image_container}>
                {/* add the three blinking stars */}
                <div>
                    <div className={styles.star1} />
                    <div className={styles.star2} />
                    <div className={styles.star3} />
                </div>
                {/* the icon of the story which changes from color to golden */}
                <div className={styles.finished_image}>
                    <img src={story.illustrations.active} alt=""/>
                    <img src={story.illustrations.gilded} className={styles.image_golden} alt=""/>
                </div>
            </div>
            {/* the text showing that the story is done */}
            <h2>Story complete!</h2><p>You finished "{story.fromLanguageName}"</p>
        </div>
    </div>
}