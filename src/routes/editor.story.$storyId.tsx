import { createFileRoute } from "@tanstack/react-router";
import StoryEditorPageClient from "@/app/editor/story/[story]/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/story/$storyId")({
  component: EditorStoryRoute,
});

function EditorStoryRoute() {
  const { storyId } = Route.useParams();

  return (
    <EditorShell>
      <StoryEditorPageClient storyId={Number.parseInt(storyId, 10)} />
    </EditorShell>
  );
}
