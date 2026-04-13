import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/app/admin/layout";
import CourseListClient from "@/app/admin/courses/page_client";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCoursesRoute,
});

function AdminCoursesRoute() {
  return (
    <AdminLayout>
      <CourseListClient />
    </AdminLayout>
  );
}
