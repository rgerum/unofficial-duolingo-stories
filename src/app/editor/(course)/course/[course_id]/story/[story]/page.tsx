import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import StoryEditorPageClient from "@/app/editor/story/[story]/page_client";

function getCanonicalStoryEditorPath(courseShort: string, storyId: number) {
  return `/editor/course/${courseShort}/story/${storyId}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: string; story: number }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const storyId = Number(resolvedParams.story);
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
  params: Promise<{ course_id: string; story: number }>;
  searchParams?: Promise<{ line?: string | string[] }>;
}) {
  const resolvedParams = await params;
  const storyId = Number(resolvedParams.story);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawLine = resolvedSearchParams?.line;
  const initialFocusLine =
    typeof rawLine === "string"
      ? Number(rawLine)
      : Array.isArray(rawLine)
        ? Number(rawLine[0])
        : undefined;

  return (
    <StoryEditorPageClient
      storyId={storyId}
      courseId={resolvedParams.course_id}
      initialFocusLine={
        Number.isFinite(initialFocusLine) && (initialFocusLine ?? 0) > 0
          ? initialFocusLine
          : undefined
      }
    />
  );
}
