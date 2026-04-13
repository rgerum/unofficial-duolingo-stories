import { createFileRoute } from "@tanstack/react-router";
import { StoryAutoPlayPage } from "@/routes/-components/story_routes";

export const Route = createFileRoute("/story/$storyId/auto_play")({
  component: StoryAutoPlayRoute,
});

function StoryAutoPlayRoute() {
  const { storyId } = Route.useParams();

  return <StoryAutoPlayPage storyId={Number.parseInt(storyId, 10)} />;
}
