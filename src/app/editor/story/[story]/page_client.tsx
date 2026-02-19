"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import EditorV2 from "./v2/editor_v2";
import type { Avatar, StoryData } from "./types";

export default function StoryEditorPageClient({
  storyId,
}: {
  storyId: number;
}) {
  const data = useQuery(api.editorRead.getEditorStoryPageData, { storyId });
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    data ? { languageLegacyId: data.story_data.learning_language } : "skip",
  );

  if (data === undefined) return <Spinner />;
  if (!data) return <p>Story not found.</p>;

  const avatarNames: Record<number, Avatar> = {};
  for (const avatar of (avatarRows ?? []) as Avatar[]) {
    avatarNames[avatar.avatar_id] = avatar;
  }

  return (
    <EditorV2
      story_data={data.story_data as StoryData}
      avatar_names={avatarNames}
    />
  );
}
