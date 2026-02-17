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

export async function togglePublished(id: number): Promise<void> {
  await requireAdmin();

  await fetchAuthMutation(api.adminStoryWrite.togglePublished, {
    legacyStoryId: id,
    operationKey: `story:${id}:admin_toggle_published:admin2`,
  });

  revalidateTag("course_data", "max");
  revalidateTag("story_data", "max");
}

export async function removeApproval(
  storyId: number,
  approvalId: number,
): Promise<void> {
  await requireAdmin();

  await fetchAuthMutation(api.adminStoryWrite.removeApproval, {
    legacyStoryId: storyId,
    legacyApprovalId: approvalId,
    operationKey: `story_approval:${approvalId}:admin_delete:admin2`,
  });

  revalidateTag("story_data", "max");
}
