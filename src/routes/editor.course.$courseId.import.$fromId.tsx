import { createFileRoute } from "@tanstack/react-router";
import ImportPageClient from "@/app/editor/(course)/course/[course_id]/import/[from_id]/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/course/$courseId/import/$fromId")(
  {
    component: EditorCourseImportRoute,
  },
);

function EditorCourseImportRoute() {
  const { courseId, fromId } = Route.useParams();

  return (
    <EditorShell>
      <ImportPageClient courseId={courseId} fromId={fromId} />
    </EditorShell>
  );
}
