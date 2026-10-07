import React from "react";
import { getUser, isContributor } from "@/lib/userInterface";
import { redirect } from "next/navigation";
import { EditorHeaderProvider } from "./_components/header_context";
import { StoryEditorPreferencesProvider } from "./_components/story_editor_preferences";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!isContributor(user)) redirect("/auth/editor");

  return (
    <EditorHeaderProvider>
      <StoryEditorPreferencesProvider>
        {children}
      </StoryEditorPreferencesProvider>
    </EditorHeaderProvider>
  );
}
