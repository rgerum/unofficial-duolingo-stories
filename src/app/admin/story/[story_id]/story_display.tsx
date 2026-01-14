"use client";
import Switch from "@/components/layout/switch";
import { useState } from "react";
import Link from "next/link";
import type { Story } from "./page";
import { togglePublished, removeApproval as removeApprovalAction } from "./actions";

export default function StoryDisplay({ story }: { story: Story }) {
  const [story_, setStory] = useState<Story>(story);

  // Render data...
  async function changePublished() {
    const updated = await togglePublished(story_.id, story_.public);
    setStory(updated);
  }
  async function deleteApproval(approval_id: number) {
    const updated = await removeApprovalAction(story_.id, approval_id);
    setStory(updated);
  }
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <img
        alt="story image"
        src={"https://stories-cdn.duolingo.com/image/" + story_.image + ".svg"}
        width={"200px"}
      />
      <h1>{story_.name}</h1>
      <p>
        Published <Switch checked={story_.public} onClick={changePublished} />
      </p>
      <Link href={`/editor/course/${story_.short}`}>Course {story_.short}</Link>
      <h2>Approvals</h2>
      <ul>
        {story_.approvals.map((d) => (
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
