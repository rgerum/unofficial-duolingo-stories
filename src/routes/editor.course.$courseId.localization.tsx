import { createFileRoute } from "@tanstack/react-router";
import CourseLocalizationPageClient from "@/app/editor/(course)/course/[course_id]/localization/page_client";
import { EditorShell } from "@/routes/-components/editor_shell";

export const Route = createFileRoute("/editor/course/$courseId/localization")({
  component: EditorCourseLocalizationRoute,
});

function EditorCourseLocalizationRoute() {
  const { courseId } = Route.useParams();

  return (
    <EditorShell>
      <CourseLocalizationPageClient courseId={courseId} />
    </EditorShell>
  );
}
