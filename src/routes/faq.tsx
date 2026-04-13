import { createFileRoute } from "@tanstack/react-router";
import MainLayout from "@/app/(stories)/(main)/layout";
import FAQPage from "@/app/(stories)/(main)/faq/page";

export const Route = createFileRoute("/faq")({
  component: FAQRoute,
});

function FAQRoute() {
  return (
    <MainLayout>
      <FAQPage />
    </MainLayout>
  );
}
