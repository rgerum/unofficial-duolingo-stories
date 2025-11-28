import React from "react";
import { get_story } from "../getStory";
import StoryWrapper from "./story_wrapper";

export default async function Page({ params }) {
  const story_id = (await params).story_id;
  const story = await get_story(story_id);

  return <StoryWrapper story={story} />;
}
