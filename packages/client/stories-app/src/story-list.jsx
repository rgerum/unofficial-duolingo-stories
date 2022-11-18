import './story-list.css'
import {Link, useParams} from "react-router-dom";
import {useSuspendedDataFetcher} from "./api_calls/include";
import {getStoriesSets} from "./api_calls/course";

export default function SetList({userdata, storyFinishedIndex}) {
    let {lang,lang_base} = useParams();
    const course = useSuspendedDataFetcher(getStoriesSets, [lang, lang_base, userdata.username, storyFinishedIndex]);

    return <div id="story_list">
        {course.about ?
            <div className="set_list">
                <div className="set_title">About</div><p>
                {course.about}
            </p>
            </div>
            : <></>}
        {course.sets.map(set => (
            <div key={set[0].set_id} className="set_list">
                <div className="set_title">Set {set[0].set_id}</div>
                {set.map(story => (
                    <StoryButton key={story.id} story={story} />
                ))}
            </div>
        ))}
    </div>
}

function StoryButton({story}) {
    return <Link
        data-cy={"story_button_"+story.id}
        className="button_story_parent"
        to={`/story/${story.id}`}
    >
        <div
            className="button_story_img"
            data-done={story.time != null}
            style={story.time === null ? {background: "#"+story.activeLip} : {}}
        >
            <img src={story.time != null ? story.gilded : story.active} alt=""/>
        </div>
        <div
            className="button_story_text"
        >{story.name}</div>
    </Link>;
}
