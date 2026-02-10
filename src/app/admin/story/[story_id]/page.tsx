import { sql } from "@/lib/db";
import { notFound } from "next/navigation";
import StoryDisplay from "./story_display";
import { StorySchema } from "./schema";
export type { Story } from "./schema";
import { fetchAuthQuery } from "@/lib/auth-server";
import { components } from "@convex/_generated/api";

async function story_properties(id: string) {
  const data =
    await sql`SELECT story.id, story.name, story.image, story.public, course.short FROM story JOIN course ON course.id = story.course_id WHERE story.id = ${id};`;
  if (data.length === 0) return undefined;
  const story = data[0];
  const approvals =
    await sql`SELECT a.id, a.date, a.user_id FROM story_approval a WHERE a.story_id = ${id};`;

  if (approvals.length) {
    const authUsers = (await fetchAuthQuery(
      components.betterAuth.adapter.findMany as any,
      {
        model: "user",
        where: [],
        paginationOpts: { cursor: null, numItems: 1000 },
      },
    )) as any;
    const userById = new Map<number, { name?: string }>(
      authUsers.page.map((user: { userId?: string | null; name?: string }) => [
        Number(user.userId),
        user,
      ]),
    );
    story.approvals = approvals.map((row: any) => ({
      id: row.id,
      date: row.date,
      name: userById.get(row.user_id)?.name ?? "Unknown",
    }));
  } else {
    story.approvals = [];
  }
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
