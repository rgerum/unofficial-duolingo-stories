import StoryDisplay from "./story_display";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
