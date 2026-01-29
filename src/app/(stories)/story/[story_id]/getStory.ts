import { sql } from "@/lib/db";
import { StoryType } from "@/components/editor/story/syntax_parser_new";
import { z } from "zod";
import { StoryElement } from "@/components/editor/story/syntax_parser_types";

const story_additional_data = z.object({
  id: z.number(),
  course_id: z.number(),
  from_language: z.string(),
  from_language_id: z.number(),
  from_language_long: z.string(),
  from_language_rtl: z.boolean(),
  from_language_name: z.string(),
  learning_language: z.string(),
  learning_language_long: z.string(),
  learning_language_rtl: z.boolean(),
  course_short: z.string(),
});

export async function get_story(story_id: number) {
  let res =
    await sql`SELECT l1.short AS from_language, l2.short AS learning_language, c.from_language as from_language_id,
              l1.name AS from_language_long, l2.name AS learning_language_long, 
              story.name AS from_language_name,
              l1.rtl AS from_language_rtl, l2.rtl AS learning_language_rtl,
              story.id, story.json, story.course_id
              FROM story 
              JOIN course c on story.course_id = c.id 
              LEFT JOIN language l1 ON l1.id = c.from_language
              LEFT JOIN language l2 ON l2.id = c.learning_language 
              WHERE story.id = ${story_id};`;
  if (res.length === 0) {
    //result.sendStatus(404);
    return;
  }
  const data =
    typeof res[0]["json"] === "string"
      ? JSON.parse(res[0]["json"])
      : res[0]["json"];
  const data2 = {
    elements: data.elements as StoryElement[],
    illustrations: data.illustrations as {
      gilded: string;
      active: string;
      locked: string;
    },
  };
  const additional_data = story_additional_data.parse({
    id: res[0]["id"],
    course_id: res[0]["course_id"],

    from_language: res[0]["from_language"],
    from_language_id: res[0]["from_language_id"],
    from_language_long: res[0]["from_language_long"],
    from_language_rtl: res[0]["from_language_rtl"],
    from_language_name: res[0]["from_language_name"],

    learning_language: res[0]["learning_language"],
    learning_language_long: res[0]["learning_language_long"],
    learning_language_rtl: res[0]["learning_language_rtl"],

    course_short: res[0]["learning_language"] + "-" + res[0]["from_language"],
  });
  //console.log(data);
  //console.log(additional_data);
  return { ...data2, ...additional_data };
}

export type StoryData = NonNullable<Awaited<ReturnType<typeof get_story>>>;
