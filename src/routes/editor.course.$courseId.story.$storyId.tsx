import { createFileRoute } from "@tanstack/react-router";
import StoryEditorPageClient from "@/app/editor/story/[story]/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/course/$courseId/story/$storyId")(
  {
    component: EditorCourseStoryRoute,
  },
);

function EditorCourseStoryRoute() {
  const { courseId, storyId } = Route.useParams();

  return (
    <EditorShell>
      <StoryEditorPageClient
        courseId={courseId}
        storyId={Number.parseInt(storyId, 10)}
      />
    </EditorShell>
  );
}
