import StoryDetail from "./story_detail";

export default async function Admin2StoryPage({
  params,
}: {
  params: Promise<{ story_id: string }>;
}) {
  const storyId = Number.parseInt((await params).story_id, 10);
  if (!Number.isFinite(storyId)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        Invalid story id.
      </div>
    );
  }
  return <StoryDetail storyId={storyId} />;
}
