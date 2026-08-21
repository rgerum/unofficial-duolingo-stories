import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import StoryFeedbackPageClient from "../../../feedback/page_client";
import { parseFeedbackStatus } from "@/app/editor/feedback/feedback_return_navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: string }>;
}): Promise<Metadata> {
  const courseId = (await params).course_id;
  const course = await fetchAuthQuery(
    api.editorRead.getEditorCourseByIdentifier,
    {
      identifier: courseId,
    },
  );

  if (!course) notFound();

  return {
    title: `${course.learning_language_name} Feedback | Duostories Editor`,
  };
}

export default async function CourseFeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ course_id: string }>;
  searchParams?: Promise<{ status?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return (
    <StoryFeedbackPageClient
      courseId={(await params).course_id}
      initialStatus={parseFeedbackStatus(resolvedSearchParams?.status)}
    />
  );
}
