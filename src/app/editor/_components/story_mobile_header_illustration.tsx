export default function StoryMobileHeaderIllustration({
  storyIllustrationId,
}: {
  storyIllustrationId?: string | null;
}) {
  return (
    <div className="shrink-0">
      <img
        src={
          storyIllustrationId
            ? `https://stories-cdn.duolingo.com/image/${storyIllustrationId}.svg`
            : "/editor/icons/empty_title.svg"
        }
        alt=""
        width={24}
        height={24}
        className="size-6 shrink-0 object-contain"
      />
    </div>
  );
}
