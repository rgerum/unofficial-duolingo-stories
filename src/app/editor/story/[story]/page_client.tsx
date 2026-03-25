"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Spinner } from "@/components/ui/spinner";
import EditorV2 from "./v2/editor_v2";
import type { Avatar, StoryEditorPageData } from "./types";

export default function StoryEditorPageClient({
  storyId,
}: {
  storyId: number;
}) {
  const data = useQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  }) as StoryEditorPageData | null | undefined;
  const currentUser = useQuery(api.auth.getCurrentUser);
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    data ? { languageLegacyId: data.story_data.learning_language } : "skip",
  );

  if (data === undefined || currentUser === undefined) return <Spinner />;
  if (!data) return <p>Story not found.</p>;

  const avatarNames: Record<number, Avatar> = {};
  for (const avatar of (avatarRows ?? []) as Avatar[]) {
    avatarNames[avatar.avatar_id] = avatar;
  }

  return (
    <EditorV2
      isAdmin={currentUser?.role === "admin"}
      story_data={data.story_data}
      avatar_names={avatarNames}
    />
  );
}
