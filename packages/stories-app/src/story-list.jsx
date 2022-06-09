import './story-list.css'

import {Spinner} from "./react/spinner";


export function SetList(props) {
    const sets = props.sets;

    if(sets === undefined)
        return <Spinner />;

    return <div id="story_list">
        {sets.map(stories => (
            <div key={stories[0].set_id} className="set_list">
                <div className="set_title">Set {stories[0].set_id}</div>
                {stories.map(story => (
                    <StoryButton key={story.id} story={story} onStoryClicked={props.onStoryClicked}  />
                ))}
            </div>
        ))}
    </div>
}

function StoryButton(props) {
    let story = props.story;
    return <div
        data-cy={"story_button_"+story.id}
        className="button_story_parent"
        onClick={(e) => {e.preventDefault(); props.onStoryClicked(story.id); }}
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
    </div>;
}
