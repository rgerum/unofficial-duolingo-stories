import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { api } from "@convex/_generated/api";
import { fetchAuthQuery } from "@/lib/auth-server";
import StoryFeedbackPageClient from "../../../feedback/page_client";

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
}: {
  params: Promise<{ course_id: string }>;
}) {
  return <StoryFeedbackPageClient courseId={(await params).course_id} />;
}
