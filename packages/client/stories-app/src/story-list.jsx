import './story-list.css'
import React, {Suspense} from "react";
import {Link, useParams} from "react-router-dom";
import {useSuspendedDataFetcher} from "./api_calls/include";
import {getStoriesSets} from "./api_calls/course";
import {Legal, Spinner} from "ui_elements";
import {Helmet} from "react-helmet-async";

export default function MainContentSetList({userdata, storyFinishedIndex}) {
    let {lang, lang_base} = useParams();

    const course = useSuspendedDataFetcher(getStoriesSets, [lang, lang_base, userdata.username, storyFinishedIndex]);

    document.title = `${course.learningLanguageName} Duolingo Stories`;

    let conlangs = [];
    let count = 0;
    for(let set of course.sets)
        count += set.length;

    return <>
        <Helmet>
            <link rel="canonical" href={`https://www.duostories.org/${lang}-${lang_base}`} />
            <meta name="description" content={`Improve your ${course.learningLanguageName} learning by community-translated Duolingo stories.`}/>
            <meta name="keywords" content={`${course.learningLanguageName}, language, learning, stories, Duolingo, community, volunteers`}/>
        </Helmet>

        <header>
            <h1 className={"main_title"}>Unofficial {course.learningLanguageName} Duolingo Stories</h1>
            <p className={"title_desc"}>
                Learn {course.learningLanguageName} with {count} community translated Duolingo Stories.
            </p>
            <p className={"title_desc"}>
                If you want to contribute or discuss the stories, meet us on <a href="https://discord.gg/4NGVScARR3">Discord</a><br/>
                or learn more about the project in our <Link to={"/faq"}>FAQ</Link>.
            </p>
            {Object.keys(conlangs).length ?
                <p><b>Notice:</b> You're currently on the page for conlangs without ISO-3 codes. We keep them here as to not clutter the front page, but we're always happy to have more!
                    <br/> To return to the main page, click <Link to="/" >here</Link>.
                </p>
                : <></>}
        </header>

        <Suspense fallback={<Spinner />}>
            <SetList course={course} userdata={userdata} conlang_count={conlangs.length} storyFinishedIndex={storyFinishedIndex} />
            <hr/>
            <Legal/>
        </Suspense>
    </>
}

export function SetList({course}) {

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
