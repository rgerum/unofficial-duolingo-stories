"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { removeApproval, togglePublished } from "./actions";
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Switch,
} from "@/components/ui/shadcn";

function formatApprovalDate(value: unknown) {
  const asNumber = typeof value === "number" ? value : Number(String(value ?? "").trim());
  const date = Number.isFinite(asNumber) ? new Date(asNumber) : new Date(String(value ?? ""));
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function StoryDetail({ storyId }: { storyId: number }) {
  const story = useQuery(api.adminData.getAdminStoryByLegacyId, {
    legacyStoryId: storyId,
  });

  if (story === undefined) {
    return <div className="text-sm text-slate-500">Loading story...</div>;
  }

  if (!story) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">Story not found.</div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin2/story" className="text-sm font-medium text-slate-600 underline underline-offset-2">
          Back to story search
        </Link>
        <Link href={`/editor/story/${story.id}`} className={buttonVariants({ size: "sm" })}>
          Edit story
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{story.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
            <img
              alt="story image"
              src={`https://stories-cdn.duolingo.com/image/${story.image}.svg`}
              width={120}
              height={120}
              className="rounded-xl border border-slate-200 bg-slate-50"
            />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Story ID:</span>
                <span>{story.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Legacy ID:</span>
                <span>{storyId}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Published:</span>
                <span className="inline-flex items-center gap-2">
                  <Switch checked={story.public} onCheckedChange={() => togglePublished(story.id)} />
                  <Badge variant={story.public ? "success" : "danger"}>{story.public ? "Yes" : "No"}</Badge>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Course:</span>
                <Link href={`/editor/course/${story.short}`} className="underline underline-offset-2">
                  {story.short}
                </Link>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-lg font-semibold text-slate-900">Approvals</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
            {story.approvals.length === 0 ? (
              <div className="px-3 py-3 text-sm text-slate-500">No approvals.</div>
            ) : (
              story.approvals.map((approval, index) => (
                <div
                  key={approval.id}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <span>
                    {formatApprovalDate(approval.date)} - {approval.name}
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeApproval(story.id, approval.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
