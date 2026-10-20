import { api } from "@convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";

// The client subscribes to the live query after hydration, so a cached
// snapshot only affects the first paint. Remote cache so the snapshot is
// shared across serverless instances instead of refetched per invocation.
export async function preload_course_page_data(short: string) {
  "use cache: remote";
  cacheLife("hours");
  cacheTag(`course-${short}`);
  return await preloadQuery(api.landing.getPublicCoursePageData, { short });
}
