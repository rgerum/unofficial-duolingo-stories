import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import CourseLocalizationPageClient from "./page_client";

function getCanonicalLocalizationPath(courseShort: string) {
  return `/editor/course/${courseShort}/localization`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: string }>;
}): Promise<Metadata> {
  const courseId = (await params).course_id;
  const course = await fetchQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: courseId,
  });

  if (!course) notFound();

  return {
    title: `Localization | ${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org${getCanonicalLocalizationPath(course.short ?? courseId)}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  return <CourseLocalizationPageClient courseId={(await params).course_id} />;
}
