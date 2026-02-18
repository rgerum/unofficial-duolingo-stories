"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import Switch from "@/components/ui/switch";
import Button from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  togglePublished,
  removeApproval as removeApprovalAction,
} from "./actions";

export default function StoryDisplay({ storyId }: { storyId: number }) {
  const story = useQuery(api.adminData.getAdminStoryByLegacyId, {
    legacyStoryId: storyId,
  });

  if (story === undefined) {
    return (
      <div className="mx-auto my-6 mb-10 w-[min(860px,calc(100vw-32px))]">
        <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto my-6 mb-10 w-[min(860px,calc(100vw-32px))]">
        <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
          Story not found.
        </div>
      </div>
    );
  }

  const storyData = story;

  async function changePublished() {
    await togglePublished(storyData.id, storyData.public);
  }

  async function deleteApproval(approvalId: number) {
    await removeApprovalAction(storyData.id, approvalId);
  }

  function formatApprovalDate(value: unknown) {
    const asNumber =
      typeof value === "number" ? value : Number(String(value ?? "").trim());
    const date = Number.isFinite(asNumber)
      ? new Date(asNumber)
      : new Date(String(value ?? ""));
    if (Number.isNaN(date.getTime())) return String(value ?? "");
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  return (
    <div className="mx-auto my-6 mb-10 w-[min(860px,calc(100vw-32px))]">
      <div className="rounded-2xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[var(--body-background)] p-5 shadow-[0_16px_38px_color-mix(in_srgb,#000_14%,transparent)]">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
          <Link
            className="whitespace-nowrap underline underline-offset-2"
            href="/admin/story"
          >
            Back to Story Search
          </Link>
          <Link href={`/editor/story/${storyData.id}`}>
            <Button>Edit Story</Button>
          </Link>
        </div>

        <div className="mb-3 flex flex-col items-start gap-4 md:flex-row md:items-center">
          <img
            className="rounded-xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] bg-[color:color-mix(in_srgb,var(--body-background-faint)_85%,transparent)]"
            alt="story image"
            src={`https://stories-cdn.duolingo.com/image/${storyData.image}.svg`}
            width={132}
            height={132}
          />
          <div>
            <h1 className="m-0 text-[2rem] leading-[1.15]">{storyData.name}</h1>
            <div className="mt-3 mb-5 grid grid-cols-1 gap-x-3 gap-y-2 md:grid-cols-[160px_minmax(0,1fr)]">
              <div className="text-left text-[var(--text-color-dim)] md:text-right">
                Story ID
              </div>
              <div className="min-w-0 break-words">{storyData.id}</div>
              <div className="text-left text-[var(--text-color-dim)] md:text-right">
                Legacy ID
              </div>
              <div className="min-w-0 break-words">{storyId}</div>
              <div className="text-left text-[var(--text-color-dim)] md:text-right">
                Published
              </div>
              <div className="min-w-0 break-words">
                <span className="inline-flex items-center gap-2">
                  <Switch
                    checked={storyData.public}
                    onClick={changePublished}
                  />
                  {storyData.public ? "Yes" : "No"}
                </span>
              </div>
              <div className="text-left text-[var(--text-color-dim)] md:text-right">
                Course
              </div>
              <div className="min-w-0 break-words">
                <Link
                  className="underline underline-offset-2"
                  href={`/editor/course/${storyData.short}`}
                >
                  {storyData.short}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <h2 className="my-5 text-[1.2rem]">Approvals</h2>
        {storyData.approvals.length === 0 ? (
          <div>No approvals.</div>
        ) : (
          <ul className="m-0 list-none overflow-hidden rounded-xl border border-[color:color-mix(in_srgb,var(--header-border)_70%,transparent)] p-0">
            {storyData.approvals.map((approval, index) => (
              <li
                key={approval.id}
                className={`grid grid-cols-[minmax(0,1fr)_auto] gap-2 px-3 py-2.5 ${
                  index % 2 === 0
                    ? "bg-[var(--body-background)]"
                    : "bg-[color:color-mix(in_srgb,var(--body-background-faint)_72%,transparent)]"
                }`}
              >
                <span>
                  {formatApprovalDate(approval.date)} - {approval.name}
                </span>
                <button
                  className="cursor-pointer rounded-[10px] border-none bg-[color:color-mix(in_srgb,#ef4444_20%,transparent)] px-3 py-2 font-bold text-[#9b1c1c]"
                  type="button"
                  onClick={() => deleteApproval(approval.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
