import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { StoryElement } from "@/components/editor/story/syntax_parser_types";

export async function get_story(story_id: number) {
  const story = await fetchQuery(api.stories.getForReading, {
    legacyId: story_id,
  });

  if (!story) return undefined;

  // Parse the JSON data
  const data =
    typeof story.json === "string" ? JSON.parse(story.json) : story.json;

  const storyContent = {
    elements: data?.elements as StoryElement[],
    illustrations: data?.illustrations as {
      gilded: string;
      active: string;
      locked: string;
    },
  };

  return {
    ...storyContent,
    id: story.id,
    course_id: story.course_id,
    from_language: story.from_language,
    from_language_id: story.from_language_id,
    from_language_long: story.from_language_long,
    from_language_rtl: story.from_language_rtl,
    from_language_name: story.from_language_name,
    learning_language: story.learning_language,
    learning_language_long: story.learning_language_long,
    learning_language_rtl: story.learning_language_rtl,
    course_short: story.course_short,
  };
}

export async function get_story_meta(story_id: number) {
  const meta = await fetchQuery(api.stories.getMetadata, {
    legacyId: story_id,
  });

  return meta;
}

export type StoryData = NonNullable<Awaited<ReturnType<typeof get_story>>>;
