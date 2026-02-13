import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUser, isContributor } from "@/lib/userInterface";
import { getPostHogClient } from "@/lib/posthog-server";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ story_id: string }> },
) {
  const token = await getUser();

  if (!token || !isContributor(token))
    return new Response("Error not allowed", { status: 401 });

  let answer = await set_approve(parseInt((await params).story_id), token.userId);

  if (answer === undefined)
    return new Response("Error not found", { status: 404 });

  return NextResponse.json(answer);
}

async function set_approve(story_id: number, user_id: number) {
  const result = await fetchAuthMutation(api.storyApproval.toggleStoryApproval, {
    legacyStoryId: story_id,
    operationKey: `story_approval:${story_id}:user:${user_id}:toggle:route`,
  });

  // Track story approval event server-side
  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: `user_${user_id}`,
    event: "story_approved",
    properties: {
      story_id: story_id,
      action: result.action,
      approval_count: result.count,
      story_status: result.story_status,
      finished_in_set: result.finished_in_set,
      stories_published: result.published.length,
    },
  });
  await posthog.shutdown();

  if (result.published.length > 0) {
    revalidateTag("course_data", "day");
    revalidateTag("story_data", "day");
  }

  return {
    count: result.count,
    story_status: result.story_status,
    finished_in_set: result.finished_in_set,
    action: result.action,
    published: result.published,
  };
}
