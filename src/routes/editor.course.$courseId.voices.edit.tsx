import { createFileRoute } from "@tanstack/react-router";
import CourseVoicesEditPageClient from "@/app/editor/(course)/course/[course_id]/voices/edit/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/course/$courseId/voices/edit")({
  component: EditorCourseVoicesEditRoute,
});

function EditorCourseVoicesEditRoute() {
  const { courseId } = Route.useParams();

  return (
    <EditorShell>
      <CourseVoicesEditPageClient courseId={courseId} />
    </EditorShell>
  );
}
