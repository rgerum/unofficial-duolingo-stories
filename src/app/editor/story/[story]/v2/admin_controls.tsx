"use client";

import React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import Button from "@/components/ui/button";
import Switch from "@/components/ui/switch";
import {
  type AdminStoryData,
  optimisticallyRemoveApproval,
  optimisticallyTogglePublished,
} from "@/app/admin/story/admin_story_optimistic";

export default function AdminControls({ storyId }: { storyId: number }) {
  const storyData = useQuery(api.adminData.getAdminStoryByLegacyId, {
    legacyStoryId: storyId,
  }) as AdminStoryData | null | undefined;
  const togglePublishedMutation = useMutation(
    api.adminStoryWrite.togglePublished,
  ).withOptimisticUpdate(optimisticallyTogglePublished);
  const removeApprovalMutation = useMutation(
    api.adminStoryWrite.removeApproval,
  ).withOptimisticUpdate(optimisticallyRemoveApproval);
  const [publishedPending, setPublishedPending] = React.useState(false);
  const [pendingApprovalId, setPendingApprovalId] =
    React.useState<Id<"story_approval"> | null>(null);

  async function changePublished() {
    if (!storyData) return;
    const operationKey = `story:${storyData.id}:editor_toggle_published:admin_controls`;
    setPublishedPending(true);
    try {
      await togglePublishedMutation({
        legacyStoryId: storyData.id,
        operationKey,
      });
    } finally {
      setPublishedPending(false);
    }
  }

  async function deleteApproval(approvalId: Id<"story_approval">) {
    const operationKey = `story_approval:${approvalId}:editor_delete:admin_controls`;
    setPendingApprovalId(approvalId);
    try {
      await removeApprovalMutation({
        legacyStoryId: storyId,
        approvalId,
        operationKey,
      });
    } finally {
      setPendingApprovalId(null);
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_92%,white_8%)] px-4 py-3">
      <h2 className="my-0 text-[1.1rem] font-bold leading-[1.2]">
        Admin Controls
      </h2>
      {storyData === undefined ? (
        <div className="mt-3 text-[0.95rem] text-[var(--text-color-dim)]">
          Loading admin controls...
        </div>
      ) : storyData === null ? (
        <div className="mt-3 text-[0.95rem] text-[var(--text-color-dim)]">
          Admin controls unavailable.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">Published</span>
            <Switch
              checked={storyData.public}
              disabled={publishedPending}
              onClick={changePublished}
            />
            <span className="text-[0.95rem] text-[var(--text-color-dim)]">
              {storyData.public ? "Yes" : "No"}
            </span>
          </div>
          <div>
            <h3 className="my-0 text-[1rem] font-bold leading-[1.2]">
              Approvals
            </h3>
            {storyData.approvals.length === 0 ? (
              <div className="mt-2 text-[0.95rem] text-[var(--text-color-dim)]">
                No approvals.
              </div>
            ) : (
              <ul className="mt-2 mb-0 list-none overflow-hidden rounded-lg border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] p-0">
                {storyData.approvals.map((approval, index) => (
                  <ApprovalRow key={approval.id} index={index}>
                    <span className="min-w-0 text-[0.95rem]">
                      {formatApprovalDate(approval.date)} - {approval.name}
                    </span>
                    <Button
                      className="mt-0"
                      variant="destructive"
                      size="sm"
                      type="button"
                      disabled={pendingApprovalId === approval.id}
                      onClick={() => deleteApproval(approval.id)}
                    >
                      Remove
                    </Button>
                  </ApprovalRow>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ApprovalRow({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const backgroundClassName =
    index % 2 === 0
      ? "bg-[var(--body-background)]"
      : "bg-[color:color-mix(in_srgb,var(--body-background-faint)_72%,transparent)]";

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2 ${backgroundClassName}`}
    >
      {children}
    </li>
  );
}

function formatApprovalDate(value: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
