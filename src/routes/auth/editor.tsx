import { createFileRoute } from "@tanstack/react-router";
import AuthLayout from "@/app/auth/layout";
import EditorAccessPage from "@/app/auth/editor/page";

export const Route = createFileRoute("/auth/editor")({
  component: AuthEditorRoute,
});

function AuthEditorRoute() {
  return (
    <AuthLayout>
      <EditorAccessPage />
    </AuthLayout>
  );
}
