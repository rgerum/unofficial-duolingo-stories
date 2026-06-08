import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export type AdminStoryData = NonNullable<
  FunctionReturnType<typeof api.adminData.getAdminStoryByLegacyId>
>;

export function optimisticallyTogglePublished(
  localStore: OptimisticLocalStore,
  args: { legacyStoryId: number },
) {
  const queryArgs = { legacyStoryId: args.legacyStoryId };
  const story = localStore.getQuery(
    api.adminData.getAdminStoryByLegacyId,
    queryArgs,
  );
  if (!story) return;

  localStore.setQuery(api.adminData.getAdminStoryByLegacyId, queryArgs, {
    ...story,
    public: !story.public,
  });
}

export function optimisticallyRemoveApproval(
  localStore: OptimisticLocalStore,
  args: { legacyStoryId: number; approvalId: Id<"story_approval"> },
) {
  const queryArgs = { legacyStoryId: args.legacyStoryId };
  const story = localStore.getQuery(
    api.adminData.getAdminStoryByLegacyId,
    queryArgs,
  );
  if (!story) return;

  localStore.setQuery(api.adminData.getAdminStoryByLegacyId, queryArgs, {
    ...story,
    approvals: story.approvals.filter(
      (approval) => approval.id !== args.approvalId,
    ),
  });
}
