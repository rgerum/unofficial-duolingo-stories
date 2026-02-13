"use server";

import { revalidateTag } from "next/cache";
import { getUser, isAdmin } from "@/lib/userInterface";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

async function requireAdmin() {
  const token = await getUser();
  if (!isAdmin(token)) {
    throw new Error("You need to be a registered admin.");
  }
}

export async function togglePublished(
  id: number,
  _currentPublic: boolean,
): Promise<void> {
  await requireAdmin();

  await fetchAuthMutation(api.adminStoryWrite.togglePublished, {
    legacyStoryId: id,
    operationKey: `story:${id}:admin_toggle_published:action`,
  });

  revalidateTag("course_data", "max");
  revalidateTag("story_data", "max");
}

export async function removeApproval(
  storyId: number,
  approval_id: number,
): Promise<void> {
  await requireAdmin();

  await fetchAuthMutation(api.adminStoryWrite.removeApproval, {
    legacyStoryId: storyId,
    legacyApprovalId: approval_id,
    operationKey: `story_approval:${approval_id}:admin_delete:action`,
  });

  revalidateTag("story_data", "max");
}
