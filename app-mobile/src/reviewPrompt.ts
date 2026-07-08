import * as StoreReview from "expo-store-review";
import { captureMobileEvent } from "./analytics";
import { getString, removeKeys, setString, STORAGE_KEYS } from "./storage";

const PROMPT_MILESTONES = [3, 10] as const;
const COOLDOWN_MS = 75 * 24 * 60 * 60 * 1000;
const PENDING_COMPLETION_TTL_MS = 10 * 60 * 1000;

type ReviewPromptState = {
  attemptedMilestones: number[];
  lastAttemptedAt: number | null;
};

type PendingReviewPromptCompletion = {
  courseShort: string;
  storyId: number;
  completedAt: number;
};

function parseJsonObject<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as T)
      : null;
  } catch {
    return null;
  }
}

async function getReviewPromptState(): Promise<ReviewPromptState> {
  const parsed = parseJsonObject<Partial<ReviewPromptState>>(
    await getString(STORAGE_KEYS.reviewPromptState),
  );
  const lastAttemptedAt = parsed?.lastAttemptedAt;
  return {
    attemptedMilestones: Array.isArray(parsed?.attemptedMilestones)
      ? parsed.attemptedMilestones.filter(Number.isFinite)
      : [],
    lastAttemptedAt:
      typeof lastAttemptedAt === "number" && Number.isFinite(lastAttemptedAt)
        ? lastAttemptedAt
        : null,
  };
}

async function setReviewPromptState(state: ReviewPromptState): Promise<void> {
  await setString(STORAGE_KEYS.reviewPromptState, JSON.stringify(state));
}

export async function markReviewPromptCompletionPending({
  courseShort,
  storyId,
}: {
  courseShort: string;
  storyId: number;
}): Promise<void> {
  await setString(
    STORAGE_KEYS.pendingReviewPromptCompletion,
    JSON.stringify({ courseShort, storyId, completedAt: Date.now() }),
  );
}

function getNextMilestone(
  completedStoryCount: number,
  attemptedMilestones: number[],
): number | null {
  return (
    PROMPT_MILESTONES.find(
      (milestone) =>
        completedStoryCount >= milestone && !attemptedMilestones.includes(milestone),
    ) ?? null
  );
}

export async function maybeRequestAppReview({
  completedStoryCount,
  courseShort,
  signedIn,
}: {
  completedStoryCount: number;
  courseShort: string;
  signedIn: boolean;
}): Promise<void> {
  const pending = parseJsonObject<PendingReviewPromptCompletion>(
    await getString(STORAGE_KEYS.pendingReviewPromptCompletion),
  );
  if (!pending || pending.courseShort !== courseShort) return;

  await removeKeys([STORAGE_KEYS.pendingReviewPromptCompletion]);

  const now = Date.now();
  if (now - pending.completedAt > PENDING_COMPLETION_TTL_MS) return;

  const state = await getReviewPromptState();
  const milestone = getNextMilestone(
    completedStoryCount,
    state.attemptedMilestones,
  );
  if (!milestone) return;
  if (state.lastAttemptedAt && now - state.lastAttemptedAt < COOLDOWN_MS) return;

  const canRequestReview = await canRequestNativeReview();
  if (!canRequestReview) {
    await captureMobileEvent("mobile_app_review_prompt_unavailable", {
      completed_story_count: completedStoryCount,
      course_short: courseShort,
      milestone,
      signed_in: signedIn,
    });
    return;
  }

  try {
    await StoreReview.requestReview();
    await setReviewPromptState({
      attemptedMilestones: [...state.attemptedMilestones, milestone],
      lastAttemptedAt: now,
    });
    await captureMobileEvent("mobile_app_review_prompt_attempted", {
      completed_story_count: completedStoryCount,
      course_short: courseShort,
      milestone,
      signed_in: signedIn,
    });
  } catch (error) {
    await captureMobileEvent("mobile_app_review_prompt_failed", {
      completed_story_count: completedStoryCount,
      course_short: courseShort,
      error: error instanceof Error ? error.message : String(error),
      milestone,
      signed_in: signedIn,
    });
  }
}

async function canRequestNativeReview(): Promise<boolean> {
  try {
    return (await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction());
  } catch {
    return false;
  }
}
