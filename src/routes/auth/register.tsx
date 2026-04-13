import { createFileRoute } from "@tanstack/react-router";
import AuthLayout from "@/app/auth/layout";
import Register from "@/app/auth/register/register";

export const Route = createFileRoute("/auth/register")({
  component: RegisterRoute,
});

function RegisterRoute() {
  return (
    <AuthLayout>
      <Register />
    </AuthLayout>
  );
}
