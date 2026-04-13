import { createFileRoute } from "@tanstack/react-router";
import CourseEditorPageClient from "@/app/editor/(course)/course/[course_id]/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/course/$courseId")({
  component: EditorCourseRoute,
});

function EditorCourseRoute() {
  const { courseId } = Route.useParams();

  return (
    <EditorShell>
      <CourseEditorPageClient courseId={courseId} />
    </EditorShell>
  );
}
