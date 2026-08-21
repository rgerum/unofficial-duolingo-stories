import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import CourseStatsPageClient from "./page_client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: string }>;
}): Promise<Metadata> {
  const courseId = (await params).course_id;
  const course = await fetchAuthQuery(
    api.editorRead.getEditorCourseByIdentifier,
    { identifier: courseId },
  );

  if (!course) notFound();

  return {
    title: `Course stats | ${course.learning_language_name} | Duostories Editor`,
  };
}

export default async function CourseStatsPage({
  params,
}: {
  params: Promise<{ course_id: string }>;
}) {
  return <CourseStatsPageClient courseId={(await params).course_id} />;
}
