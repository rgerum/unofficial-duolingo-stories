import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { getDocsData } from "./docs/[[...slug]]/doc_data";

const SITE_URL = "https://duostories.org";

export const revalidate = 3600;

const EMPTY_DOCS_DATA: Awaited<ReturnType<typeof getDocsData>> = {
  navigation: [],
};

function toUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function hasCourseShort(course: unknown): course is { short: string } {
  return (
    typeof course === "object" &&
    course !== null &&
    "short" in course &&
    typeof course.short === "string" &&
    course.short.length > 0
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let courses: Array<{ short: string }> = [];
  let docsData = EMPTY_DOCS_DATA;

  try {
    const [fetchedCourses, fetchedDocsData] = await Promise.all([
      fetchQuery(api.landing.getPublicCourseList, {}),
      getDocsData(),
    ]);
    courses = fetchedCourses.filter(hasCourseShort);
    docsData = fetchedDocsData;
  } catch (error) {
    console.error("Failed to load sitemap data:", error);
  }

  const docsEntries: MetadataRoute.Sitemap = [
    {
      url: toUrl("/docs"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...docsData.navigation.flatMap((group) =>
      group.pages.map((page) => ({
        url: toUrl(`/docs/${page.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ),
  ];

  const coursePages = await Promise.all(
    courses.map(async (course) => ({
      course,
      pageData: await fetchQuery(api.landing.getPublicCoursePageData, {
        short: course.short,
      }),
    })),
  );

  const courseEntries: MetadataRoute.Sitemap = coursePages.map(
    ({ course }) => ({
      url: toUrl(`/${course.short}`),
      changeFrequency: "daily",
      priority: 0.9,
    }),
  );

  const storyEntries: MetadataRoute.Sitemap = coursePages.flatMap(
    ({ pageData }) =>
      (pageData?.stories ?? []).map((story) => ({
        url: toUrl(`/story/${story.id}`),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
  );

  return [
    {
      url: toUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toUrl("/faq"),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: toUrl("/learn"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: toUrl("/privacy_policy"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    ...docsEntries,
    ...courseEntries,
    ...storyEntries,
  ];
}
