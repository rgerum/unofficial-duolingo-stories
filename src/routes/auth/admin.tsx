import { createFileRoute } from "@tanstack/react-router";
import AuthLayout from "@/app/auth/layout";
import AdminAccessPage from "@/app/auth/admin/page";

export const Route = createFileRoute("/auth/admin")({
  component: AuthAdminRoute,
});

function AuthAdminRoute() {
  return (
    <AuthLayout>
      <AdminAccessPage />
    </AuthLayout>
  );
}
