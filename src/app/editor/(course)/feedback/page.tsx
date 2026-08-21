import type { Metadata } from "next";
import StoryFeedbackPageClient from "./page_client";
import { parseFeedbackStatus } from "@/app/editor/feedback/feedback_return_navigation";

export const metadata: Metadata = {
  title: "Story Feedback | Duostories Editor",
};

export default async function StoryFeedbackPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string | string[] }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  return (
    <StoryFeedbackPageClient
      initialStatus={parseFeedbackStatus(resolvedSearchParams?.status)}
    />
  );
}
