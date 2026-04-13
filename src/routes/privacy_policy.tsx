import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/app/(stories)/(main)/layout";
import PrivacyPolicyPage from "@/app/(stories)/(main)/privacy_policy/page";

export const Route = createFileRoute("/privacy_policy")({
  component: PrivacyPolicyRoute,
});

function PrivacyPolicyRoute() {
  return (
    <MainLayout>
      <PrivacyPolicyPage />
    </MainLayout>
  );
}
