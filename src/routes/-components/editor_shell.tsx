import type React from "react";
import EditorLayoutClient from "@/app/editor/(course)/layout_client";
import { EditorHeaderProvider } from "@/app/editor/_components/header_context";
import { StoryEditorPreferencesProvider } from "@/app/editor/_components/story_editor_preferences";

export function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <EditorHeaderProvider>
      <StoryEditorPreferencesProvider>
        <EditorLayoutClient>{children}</EditorLayoutClient>
      </StoryEditorPreferencesProvider>
    </EditorHeaderProvider>
  );
}
