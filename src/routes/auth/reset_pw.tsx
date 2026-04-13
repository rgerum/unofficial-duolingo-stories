import { createFileRoute } from "@tanstack/react-router";
import AuthLayout from "@/app/auth/layout";
import ResetPassword from "@/app/auth/reset_pw/reset_pw";

export const Route = createFileRoute("/auth/reset_pw")({
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  return (
    <AuthLayout>
      <ResetPassword />
    </AuthLayout>
  );
}
