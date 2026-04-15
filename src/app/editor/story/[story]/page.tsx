import React from "react";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";

function getCanonicalStoryEditorPath(courseShort: string, storyId: number) {
  return `/editor/course/${courseShort}/story/${storyId}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ story: number }>;
}): Promise<Metadata> {
  const storyId = Number((await params).story);
  const story = await fetchQuery(api.editorRead.getEditorStoryPageData, {
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
  searchParams?: Promise<{ line?: string | string[] }>;
}) {
  const storyId = Number((await params).story);
  const story = await fetchQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  });

  if (!story) notFound();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const lineParam = resolvedSearchParams?.line;
  const line =
    typeof lineParam === "string"
      ? `?line=${encodeURIComponent(lineParam)}`
      : Array.isArray(lineParam) && typeof lineParam[0] === "string"
        ? `?line=${encodeURIComponent(lineParam[0])}`
        : "";

  redirect(
    `${getCanonicalStoryEditorPath(story.story_data.short, story.story_data.id)}${line}`,
  );
}
