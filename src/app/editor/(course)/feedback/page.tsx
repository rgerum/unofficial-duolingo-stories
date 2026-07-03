import type { Metadata } from "next";
import StoryFeedbackPageClient from "./page_client";

export const metadata: Metadata = {
  title: "Story Feedback | Duostories Editor",
};

export default function StoryFeedbackPage() {
  return <StoryFeedbackPageClient />;
}
