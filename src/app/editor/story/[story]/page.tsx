import React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import { parseFeedbackReturnHref } from "@/app/editor/feedback/feedback_return_navigation";

function getCanonicalStoryEditorPath(courseShort: string, storyId: number) {
  return `/editor/course/${courseShort}/story/${storyId}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story: number }>;
}): Promise<Metadata> {
  const storyId = Number((await params).story);
  const story = await fetchAuthQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  });

  if (!story) notFound();

  return {
    title: `${story.story_data.name} | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org${getCanonicalStoryEditorPath(
        story.story_data.short,
        story.story_data.id,
      )}`,
    },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ story: number }>;
  searchParams?: Promise<{
    line?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  const storyId = Number((await params).story);
  const story = await fetchAuthQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  });

  if (!story) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const lineParam = resolvedSearchParams?.line;
  const line = Array.isArray(lineParam) ? lineParam[0] : lineParam;
  const returnTo = parseFeedbackReturnHref(resolvedSearchParams?.returnTo);
  const canonicalSearchParams = new URLSearchParams();
  if (line) canonicalSearchParams.set("line", line);
  if (returnTo) canonicalSearchParams.set("returnTo", returnTo);
  const search = canonicalSearchParams.size
    ? `?${canonicalSearchParams.toString()}`
    : "";

  redirect(
    `${getCanonicalStoryEditorPath(story.story_data.short, story.story_data.id)}${search}`,
  );
}
