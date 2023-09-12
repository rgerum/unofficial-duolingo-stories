import React from "react";
import {get_story} from "../page";
import StoryWrapper from "./story_wrapper";

export default async function Page({params}) {
    const story = await get_story(params.story_id);

    return <StoryWrapper story={story}/>
}
