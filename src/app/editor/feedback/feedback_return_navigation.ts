const FEEDBACK_STATUSES = [
  "open",
  "reviewed",
  "resolved",
  "not_relevant",
  "spam",
] as const;

export type FeedbackReturnStatus = (typeof FEEDBACK_STATUSES)[number];

const COURSE_FEEDBACK_PATH = /^\/editor\/course\/[^/]+\/feedback$/;

export function createFeedbackReturnHref(
  courseIdentifier: string | undefined,
  status: FeedbackReturnStatus,
) {
  const pathname = courseIdentifier
    ? `/editor/course/${encodeURIComponent(courseIdentifier)}/feedback`
    : "/editor/feedback";

  return `${pathname}?status=${status}`;
}

export function createFeedbackStoryHref({
  courseShort,
  storyId,
  line,
  returnTo,
}: {
  courseShort: string;
  storyId: number;
  line?: number;
  returnTo: string;
}) {
  const searchParams = new URLSearchParams();
  if (line !== undefined) searchParams.set("line", String(line));
  searchParams.set("returnTo", returnTo);

  return `/editor/course/${encodeURIComponent(courseShort)}/story/${storyId}?${searchParams.toString()}`;
}

export function parseFeedbackReturnHref(value: unknown) {
  const candidate = firstString(value);
  if (!candidate) return undefined;

  let url: URL;
  try {
    url = new URL(candidate, "https://duostories.org");
  } catch {
    return undefined;
  }

  if (url.origin !== "https://duostories.org") return undefined;
  if (
    url.pathname !== "/editor/feedback" &&
    !COURSE_FEEDBACK_PATH.test(url.pathname)
  ) {
    return undefined;
  }

  const status = url.searchParams.get("status");
  if (!isFeedbackReturnStatus(status)) return undefined;

  return `${url.pathname}?status=${status}`;
}

export function parseFeedbackStatus(value: unknown): FeedbackReturnStatus {
  const candidate = firstString(value);
  return isFeedbackReturnStatus(candidate) ? candidate : "open";
}

function firstString(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function isFeedbackReturnStatus(
  value: string | null | undefined,
): value is FeedbackReturnStatus {
  return FEEDBACK_STATUSES.includes(value as FeedbackReturnStatus);
}
