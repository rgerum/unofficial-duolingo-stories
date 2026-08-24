import { api } from "@convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { cache } from "react";

export const preload_course_page_data = cache(async (short: string) => {
  return await preloadQuery(api.landing.getPublicCoursePageData, { short });
});
