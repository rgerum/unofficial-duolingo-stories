import { createFileRoute } from "@tanstack/react-router";
import CourseVoicesPageClient from "@/app/editor/(course)/course/[course_id]/voices/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/course/$courseId/voices")({
  component: EditorCourseVoicesRoute,
});

function EditorCourseVoicesRoute() {
  const { courseId } = Route.useParams();

  return (
    <EditorShell>
      <CourseVoicesPageClient courseId={courseId} />
    </EditorShell>
  );
}
