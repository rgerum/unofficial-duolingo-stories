export const NO_AUDIO_COURSE_TAG = "no-audio";
export const HUMAN_AUDIO_COURSE_TAG = "human-audio";

function hasCourseTag(tags: readonly string[] | undefined, wanted: string) {
  return (tags ?? []).some((tag) => tag.trim().toLowerCase() === wanted);
}

export function hasNoAudioCourseTag(tags: readonly string[] | undefined) {
  return hasCourseTag(tags, NO_AUDIO_COURSE_TAG);
}

/** Audio is recorded by humans instead of generated with TTS. */
export function hasHumanAudioCourseTag(tags: readonly string[] | undefined) {
  return hasCourseTag(tags, HUMAN_AUDIO_COURSE_TAG);
}
