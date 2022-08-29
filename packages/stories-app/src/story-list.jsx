import './story-list.css'
import {Link,} from "react-router-dom";
import {Spinner} from "story-component";


export function SetList(props) {
    const sets = props.sets;

    if(sets === undefined)
        return <Spinner />;

    return <div id="story_list">
        {props.desc ?
            <div className="set_list">
                <div className="set_title">About</div><p>
                {props.desc}
            </p>
            </div>
            : <></>}
        {sets.map(stories => (
            <div key={stories[0].set_id} className="set_list">
                <div className="set_title">Set {stories[0].set_id}</div>
                {stories.map(story => (
                    <StoryButton key={story.id} story={story} />
                ))}
            </div>
        ))}
    </div>
}

function StoryButton(props) {
    let story = props.story;
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
            <img src={story.time != null ? story.gilded : story.active} alt="story"/>
        </div>
        <div
            className="button_story_text"
        >{story.name}</div>
    </Link>;
}
