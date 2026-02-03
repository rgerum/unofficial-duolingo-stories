"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import React from "react";
import PostHogPageView from "@/components/PostHogPageView";

type PostHogProviderProps = {
  children: React.ReactNode;
};

export default function PostHogProviderWrapper({
  children,
}: PostHogProviderProps) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogPageView />
      {children}
    </PostHogProvider>
  );
}
