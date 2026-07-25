import React from "react";
import AudioRecorder2PageClient from "@/app/editor/(course)/course/[course_id]/story/[story]/audio-recorder2/page_client";

export default async function Page({
  params,
}: {
  params: Promise<{ course_id: string; story: string }>;
}) {
  const resolvedParams = await params;

  return (
    <AudioRecorder2PageClient
      courseId={resolvedParams.course_id}
      storyId={Number(resolvedParams.story)}
    />
  );
}
