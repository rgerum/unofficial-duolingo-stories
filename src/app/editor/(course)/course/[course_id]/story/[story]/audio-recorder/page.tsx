import React from "react";
import AudioRecorderPageClient from "@/app/editor/(course)/course/[course_id]/story/[story]/audio-recorder/page_client";

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: string; story: string }>;
}) {
  const resolvedParams = await params;

  return (
    <AudioRecorderPageClient
      courseId={resolvedParams.course_id}
      storyId={Number(resolvedParams.story)}
    />
  );
}
