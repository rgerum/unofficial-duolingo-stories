import React from "react";
import { notFound } from "next/navigation";

import CoursePageClient from "./course_page_client";
import { get_localisation_by_convex_language_id } from "@/lib/get_localisation";
import { get_course_data, get_course } from "../get_course_data";
import { ResolvingMetadata } from "next";
import { preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@convex/_generated/api";

// Every public course targets a language pair that official Duolingo Stories
// does not cover (official pairs are never public here), so the metadata can
// safely lead with that differentiator. English fallback for locales without
// meta_course_* localization entries; mirrors those strings' $language/$count.
function courseDescription(language: string, count: number) {
  const inventory =
    count > 0
      ? `${count} free interactive ${language} stories`
      : `free interactive ${language} stories`;
  return `Duolingo doesn't have stories for ${language} — Duostories does: ${inventory} with audio, translated by the community. Read, listen, and practice ${language} online.`;
}

// courses.name is the learning language's name written in the course's own
// base language ("Russo" on an Italian-based course); a few courses have it
// empty, so fall back to the English name.
function displayLanguageName(course: {
  name: string;
  learning_language_name: string;
}) {
  return course.name || course.learning_language_name;
}

export async function generateMetadata(
  { params }: { params: Promise<{ course_id: string }> },
  parent: ResolvingMetadata,
) {
  const params0 = await params;
  if (
    params0.course_id.indexOf("-") === -1 ||
    params0.course_id.indexOf(".") !== -1
  ) {
    return notFound();
  }
  const course = await get_course(params0.course_id);
  if (!course) notFound();
  const localization = await get_localisation_by_convex_language_id(
    course.fromLanguageId,
  );

  const meta = await parent;
  const languageName = displayLanguageName(course);
  const replacements = {
    $language: languageName,
    $count: `${course.count}`,
  };

  return {
    title:
      localization("meta_course_title", replacements) ||
      `${languageName} Duolingo Stories – Learn ${languageName} with Audio | Duostories`,
    description:
      localization("meta_course_description", replacements) ||
      courseDescription(languageName, course.count),
    alternates: {
      canonical: `https://duostories.org/${params0.course_id}`,
    },
    openGraph: {
      images: [
        `/api/og-course?lang=${params0.course_id.split("-")[0]}&count=${
          course.count
        }&name=${languageName}`,
      ],
      url: `https://duostories.org/${params0.course_id}`,
      type: "website",
    },
    keywords: [course.learning_language_name, ...(meta.keywords || [])],
  };
}

export async function generateStaticParams() {
  try {
    const courses = await get_course_data();
    return courses.map((course) => ({
      course_id: course.short,
    }));
  } catch (error) {
    console.error("generateStaticParams failed for /[course_id]:", error);
    return [];
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  const course_id = (await params).course_id;
  if (course_id.indexOf("-") === -1 || course_id.indexOf(".") !== -1) {
    return notFound();
  }

  const preloadedCourse = await preloadQuery(
    api.landing.getPublicCoursePageData,
    {
      short: course_id,
    },
  );
  // Unknown slugs must produce a real 404. Without this check the route
  // resolved with HTTP 200 (a soft 404) and only generateMetadata noindexed it.
  const courseData = preloadedQueryResult(preloadedCourse);
  if (!courseData) {
    return notFound();
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${displayLanguageName(courseData)} Duolingo Stories`,
    description: courseDescription(
      displayLanguageName(courseData),
      courseData.count,
    ),
    inLanguage: course_id.split("-")[0],
    numberOfItems: courseData.stories.length,
    itemListElement: courseData.stories.map((story, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://duostories.org/story/${story.id}`,
      name: story.name,
    })),
  };

  // The from-language code marks the page chrome's language for crawlers;
  // display:contents keeps the wrapper out of layout.
  const fromLanguageCode = course_id.split("-")[1];

  return (
    <>
      <script
        type="application/ld+json"
        // Story names are contributor-controlled; escape "<" so none of them
        // can contain "</script>" and terminate this tag.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
      <div lang={fromLanguageCode} className="contents">
        <CoursePageClient
          course_id={course_id}
          preloadedCourse={preloadedCourse}
        />
      </div>
    </>
  );
}
