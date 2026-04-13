import { createFileRoute } from "@tanstack/react-router";
import CoursePageClient from "@/app/(stories)/(main)/[course_id]/course_page_client";
import MainLayout from "@/app/(stories)/(main)/layout";

export const Route = createFileRoute("/$courseId")({
  component: CourseRoute,
});

function CourseRoute() {
  const { courseId } = Route.useParams();

  return (
    <MainLayout>
      <CoursePageClient course_id={courseId} />
    </MainLayout>
  );
}
