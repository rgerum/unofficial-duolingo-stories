import StoryDisplay from "./story_display";

export default async function Page({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const storyId = Number.parseInt((await params).story_id, 10);
  if (!Number.isFinite(storyId)) {
    return <div>Invalid story id.</div>;
  }

  return <StoryDisplay storyId={storyId} />;
}
