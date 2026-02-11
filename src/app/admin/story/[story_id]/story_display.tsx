"use client";
import Switch from "@/components/layout/switch";
import Link from "next/link";
import {
  togglePublished,
  removeApproval as removeApprovalAction,
} from "./actions";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

export default function StoryDisplay({ storyId }: { storyId: number }) {
  const story = useQuery(api.adminData.getAdminStoryByLegacyId, {
    legacyStoryId: storyId,
  });

  if (story === undefined) return <div>Loading...</div>;
  if (!story) return <div>Story not found.</div>;
  const storyData = story;

  async function changePublished() {
    await togglePublished(storyData.id, storyData.public);
  }
  async function deleteApproval(approval_id: number) {
    await removeApprovalAction(storyData.id, approval_id);
  }
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <img
        alt="story image"
        src={"https://stories-cdn.duolingo.com/image/" + storyData.image + ".svg"}
        width={"200px"}
      />
      <h1>{storyData.name}</h1>
      <p>
        Published <Switch checked={storyData.public} onClick={changePublished} />
      </p>
      <Link href={`/editor/course/${storyData.short}`}>Course {storyData.short}</Link>
      <h2>Approvals</h2>
      <ul>
        {storyData.approvals.map((d) => (
          <li key={d.id}>
            {`${d.date}`} {d.name}{" "}
            <span
              style={{ cursor: "pointer" }}
              onClick={() => deleteApproval(d.id)}
            >
              ✗
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
