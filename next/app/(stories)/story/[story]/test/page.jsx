import React from "react";
import {get_story} from "pages/api/story/[story_id]";
import StoryWrapper from "./story_wrapper";

export default async function Page({params}) {
    const story = await get_story(params.story);

    return <StoryWrapper story={story}/>
}
