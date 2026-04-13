import { createFileRoute } from "@tanstack/react-router";
import Button from "@/components/ui/button";

export const Route = createFileRoute("/dev/story-footer-button-test")({
  component: StoryFooterButtonTestRoute,
});

function StoryFooterButtonTestRoute() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[960px] flex-col gap-6 px-6 py-10">
      <h1 className="m-0 text-[2rem] font-extrabold">
        Story Footer Button Test
      </h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Button variant="default">Default</Button>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </main>
  );
}
