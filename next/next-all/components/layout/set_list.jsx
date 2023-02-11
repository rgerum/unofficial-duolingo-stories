import styles from "./set_list.module.css"
import StoryButton from "./story_button";
//import {useUser} from "./login/login_dialog";

export default function SetList({course}) {


    return <div className={styles.story_list}>
        {course.about ?
            <div className={styles.set_list}>
                <div className={styles.set_title}>About</div><p>
                {course.about}
            </p>
            </div>
            : <></>}
        {course.sets.map(set => (
            <div key={set[0].set_id} className={styles.set_list}>
                <div className={styles.set_title}>Set {set[0].set_id}</div>
                {set.map(story => (
                    <StoryButton key={story.id} story={story} />
                ))}
            </div>
        ))}
    </div>
}