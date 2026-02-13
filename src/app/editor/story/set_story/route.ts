import { NextResponse, NextRequest } from "next/server";
import { upload_github } from "@/lib/editor/upload_github";
import { getUser, isContributor } from "@/lib/userInterface";
import { getPostHogClient } from "@/lib/posthog-server";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

interface StoryData {
  id?: number;
  duo_id: string;
  name: string;
  image: string;
  set_id: number;
  set_index: number;
  course_id: number;
  text: string;
  json: string;
  todo_count: number;
  api?: number;
  change_date?: string;
}

export async function POST(req: NextRequest) {
  const token = await getUser();

  if (!token || !isContributor(token))
    return new Response("You need to be a registered contributor.", {
      status: 401,
    });

  let answer = await set_story(await req.json(), {
    username: token.name ?? "",
    user_id: token.userId,
  });

  if (answer === undefined)
    return new Response("Error not found.", { status: 404 });

  return NextResponse.json(answer);
}

async function set_story(
  data: StoryData,
  { username, user_id }: { username: string; user_id: number },
) {
  data["api"] = 2;
  data["change_date"] = new Date().toISOString();
  const updatedStory = await fetchAuthMutation(api.storyWrite.setStory, {
    legacyStoryId: data.id,
    duo_id: String(data.duo_id ?? ""),
    name: data.name,
    image: data.image ?? "",
    set_id: data.set_id,
    set_index: data.set_index,
    legacyCourseId: data.course_id,
    text: data.text,
    json: data.json,
    todo_count: data.todo_count,
    change_date: data.change_date,
    operationKey: `story:${data.id ?? "duo"}:set_story:route`,
  });

  if (!updatedStory) {
    return undefined;
  }

  await upload_github(
    updatedStory.id,
    updatedStory.course_id,
    updatedStory.text,
    username,
    `updated ${updatedStory.name} in course ${updatedStory.course_id}`,
  );

  // Track story saved event server-side
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: username || `user_${user_id}`,
    event: "story_saved",
    properties: {
      story_id: updatedStory.id,
      story_name: updatedStory.name,
      course_id: updatedStory.course_id,
      todo_count: updatedStory.todo_count,
      editor_username: username,
    },
  });
  await posthog.shutdown();

  return "done";
}
