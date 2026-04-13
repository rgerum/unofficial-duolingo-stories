import { createFileRoute } from "@tanstack/react-router";
import { StoryTestPage } from "@/routes/-components/story_routes";

export const Route = createFileRoute("/story/$storyId/test")({
  component: StoryTestRoute,
});

function StoryTestRoute() {
  const { storyId } = Route.useParams();

  return <StoryTestPage storyId={Number.parseInt(storyId, 10)} />;
}
