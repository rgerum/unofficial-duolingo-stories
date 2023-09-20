"use client";
import { fetch_post } from "lib/fetch_post";
import Switch from "components/layout/switch";
import { useState } from "react";
import Link from "next/link";

export default function StoryDisplay({ story }) {
  const [story_, setStory] = useState(story);

  // Render data...
  async function changePublished() {
    let res = await fetch_post(`/admin/story/set`, {
      id: story_.id,
      public: 1 - story_.public,
    });
    let data = await res.json();
    setStory(data);
  }
  async function deleteApproval(approval_id) {
    let res = await fetch_post(`/admin/story/set`, {
      id: story_.id,
      approval_id: approval_id,
    });
    let data = await res.json();
    setStory(data);
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
            {`${d.date}`} {d.username}{" "}
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
