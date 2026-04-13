import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/app/admin/layout";
import AdminHomePage from "@/app/admin/page";

export const Route = createFileRoute("/admin/")({
  component: AdminIndexRoute,
});

function AdminIndexRoute() {
  return (
    <AdminLayout>
      <AdminHomePage />
    </AdminLayout>
  );
}
