import { createFileRoute } from "@tanstack/react-router";
import { StoryScriptPage } from "@/routes/-components/story_routes";

export const Route = createFileRoute("/story/$storyId/script")({
  component: StoryScriptRoute,
});

function StoryScriptRoute() {
  const { storyId } = Route.useParams();

  return <StoryScriptPage storyId={Number.parseInt(storyId, 10)} />;
}
