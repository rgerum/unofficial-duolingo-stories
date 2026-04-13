import { createFileRoute } from "@tanstack/react-router";
import Welcome from "@/app/(stories)/learn/welcome";
import MainLayout from "@/app/(stories)/(main)/layout";

export const Route = createFileRoute("/learn")({
  component: LearnRoute,
});

function LearnRoute() {
  return (
    <MainLayout>
      <Welcome />
    </MainLayout>
  );
}
