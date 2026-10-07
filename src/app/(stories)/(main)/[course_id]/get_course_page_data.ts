import { api } from "@convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { cacheLife, cacheTag } from "next/cache";

// The client subscribes to the live query after hydration, so a cached
// snapshot only affects the first paint.
export async function preload_course_page_data(short: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(`course-${short}`);
  return await preloadQuery(api.landing.getPublicCoursePageData, { short });
}
