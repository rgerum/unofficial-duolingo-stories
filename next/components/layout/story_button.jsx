import styles from "./story_button.module.css"
import Link from "next/link";
import {useUserStoriesDone} from "../../lib/hooks";


export default function StoryButton({story}) {
    const {user_stories_done} = useUserStoriesDone();

    const done = user_stories_done && (user_stories_done?.indexOf(story.id) !== -1);

    return <Link
        data-cy={"story_button_"+story.id}
        className={styles.button_story_parent}
        href={`/story/${story.id}`}
    >
        <div
            className={styles.button_story_img}
            data-done={done}
            style={done ? {} : {background: "#"+story.activeLip}}
        >
            <img src={done ? story.gilded : story.active} alt=""/>
        </div>
        <div
            className={styles.button_story_text}
        >{story.name}</div>
    </Link>;
}