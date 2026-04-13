import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/app/admin/layout";
import AdminStorySearchPage from "@/app/admin/story/page";

export const Route = createFileRoute("/admin/story/")({
  component: AdminStoryIndexRoute,
});

function AdminStoryIndexRoute() {
  return (
    <AdminLayout>
      <AdminStorySearchPage />
    </AdminLayout>
  );
}
