import { createFileRoute } from "@tanstack/react-router";
import AdminLayout from "@/app/admin/layout";
import StoryDisplay from "@/app/admin/story/[story_id]/story_display";

export const Route = createFileRoute("/admin/story/$storyId")({
  component: AdminStoryRoute,
});

function AdminStoryRoute() {
  const { storyId } = Route.useParams();
  const parsedStoryId = Number.parseInt(storyId, 10);

  return (
    <AdminLayout>
      {Number.isFinite(parsedStoryId) ? (
        <StoryDisplay storyId={parsedStoryId} />
      ) : (
        <div className="p-6">Invalid story id.</div>
      )}
    </AdminLayout>
  );
}
