export const NO_AUDIO_COURSE_TAG = "no-audio";

export function hasNoAudioCourseTag(tags: readonly string[] | undefined) {
  return (tags ?? []).some(
    (tag) => tag.trim().toLowerCase() === NO_AUDIO_COURSE_TAG,
  );
}
