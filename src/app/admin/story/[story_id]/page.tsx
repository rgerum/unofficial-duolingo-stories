import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import StoryDisplay from "./story_display";
import { StorySchema } from "./schema";
export type { Story } from "./schema";

async function story_properties(id: string) {
  let data =
    await sql`SELECT story.id, story.name, story.image, story.public, course.short FROM story JOIN course ON course.id = story.course_id WHERE story.id = ${id};`;
  if (data.length === 0) return undefined;
  let story = data[0];
  story.approvals =
    await sql`SELECT a.id, a.date, u.name FROM story_approval a JOIN "users" u ON u.id = a.user_id WHERE a.story_id = ${id};`;
  return StorySchema.parse(story);
}

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const story = await story_properties((await params).story_id);

  if (story === undefined) notFound();

  return <StoryDisplay story={story} />;
}
