import { createFileRoute } from "@tanstack/react-router";
import { StoryPage } from "@/routes/-components/story_routes";

export const Route = createFileRoute("/story/$storyId")({
  component: StoryRoute,
});

function StoryRoute() {
  const { storyId } = Route.useParams();

  return <StoryPage storyId={Number.parseInt(storyId, 10)} />;
}
