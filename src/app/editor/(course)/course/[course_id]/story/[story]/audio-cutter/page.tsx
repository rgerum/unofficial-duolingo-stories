import React from "react";
import AudioCutterPageClient from "@/app/editor/(course)/course/[course_id]/story/[story]/audio-cutter/page_client";

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: string; story: string }>;
}) {
  const resolvedParams = await params;

  return (
    <AudioCutterPageClient
      courseId={resolvedParams.course_id}
      storyId={Number(resolvedParams.story)}
    />
  );
}
