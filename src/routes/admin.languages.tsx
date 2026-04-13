import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/app/admin/layout";
import LanguageListClient from "@/app/admin/languages/page_client";

export const Route = createFileRoute("/admin/languages")({
  component: AdminLanguagesRoute,
});

function AdminLanguagesRoute() {
  return (
    <AdminLayout>
      <LanguageListClient />
    </AdminLayout>
  );
}
