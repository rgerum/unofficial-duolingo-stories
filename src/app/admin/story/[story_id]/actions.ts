"use server";

import { createServerFn } from "@tanstack/react-start";
import { getUser, isAdmin } from "@/lib/userInterface";
import { fetchAuthMutation } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";

async function requireAdmin() {
  const token = await getUser();
  if (!isAdmin(token)) {
    throw new Error("You need to be a registered admin.");
  }
}

export const togglePublished = createServerFn({ method: "POST" })
  .inputValidator((data: { id: number; currentPublic: boolean }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();

    await fetchAuthMutation(api.adminStoryWrite.togglePublished, {
      legacyStoryId: data.id,
      operationKey: `story:${data.id}:admin_toggle_published:action`,
    });
  });

export const removeApproval = createServerFn({ method: "POST" })
  .inputValidator((data: { storyId: number; approvalId: number }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();

    await fetchAuthMutation(api.adminStoryWrite.removeApproval, {
      legacyStoryId: data.storyId,
      legacyApprovalId: data.approvalId,
      operationKey: `story_approval:${data.approvalId}:admin_delete:action`,
    });
  });
