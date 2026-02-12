import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import CourseEditorPageClient from "./page_client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: string }>;
}): Promise<Metadata> {
  const course = await fetchQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: (await params).course_id,
  });

  if (!course) notFound();

  return {
    title: `${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  return <CourseEditorPageClient courseId={(await params).course_id} />;
}
