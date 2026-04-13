import React from "react";
import { getUser, isContributor } from "@/lib/userInterface";
import { redirect } from "@/lib/router";
import { EditorHeaderProvider } from "./_components/header_context";
import { StoryEditorPreferencesProvider } from "./_components/story_editor_preferences";

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
