import type { Metadata } from "next";
import StoryFeedbackPageClient from "./page_client";
import { parseFeedbackStatus } from "@/app/editor/feedback/feedback_return_navigation";

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
