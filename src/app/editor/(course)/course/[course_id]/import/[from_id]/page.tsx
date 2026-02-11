import { notFound } from "next/navigation";
import React from "react";
import { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import ImportPageClient from "./page_client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ course_id: string; from_id: string }>;
}): Promise<Metadata> {
  const course = await fetchQuery(api.editorRead.getEditorCourseByIdentifier, {
    identifier: (await params).course_id,
  });

  if (!course) notFound();

  return {
    title: `Import | ${course.learning_language_name} (from ${course.from_language_name}) | Duostories Editor`,
    alternates: {
      canonical: `https://duostories.org/editor/${course.short}`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: string; from_id: string }>;
}) {
  const p = await params;
  return <ImportPageClient courseId={p.course_id} fromId={p.from_id} />;
}
