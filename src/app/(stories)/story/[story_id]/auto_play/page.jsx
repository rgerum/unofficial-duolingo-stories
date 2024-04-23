import React from "react";
import { get_story } from "../getStory";
import StoryWrapper from "./story_wrapper";
import { get_localisation_dict } from "../../../../../lib/get_localisation";

export default async function Page({ params }) {
  const story = await get_story(params.story_id);

  const localization = await get_localisation_dict(story?.from_language_id);

  return <StoryWrapper story={story} localization={localization} />;
}
