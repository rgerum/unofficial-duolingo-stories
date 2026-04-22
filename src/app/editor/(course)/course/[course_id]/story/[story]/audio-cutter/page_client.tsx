"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AudioCutterDialog from "@/app/editor/story/[story]/audio-cutter-dialog";
import {
  loadAudioCutterTranscript,
  storeAudioCutterOutput,
  type AudioCutterTranscriptItem,
} from "@/app/editor/story/[story]/audio-cutter-storage";

export default function AudioCutterPageClient({
  storyId,
  courseId,
}: {
  storyId: number;
  courseId: string;
}) {
  const router = useRouter();
  const shouldOpenBulkAudioOnReturnRef = React.useRef(false);
  const [transcriptItems, setTranscriptItems] = React.useState<
    AudioCutterTranscriptItem[]
  >([]);

  React.useEffect(() => {
    const syncFromStorage = () => {
      setTranscriptItems(loadAudioCutterTranscript(storyId));
    };

    syncFromStorage();
    window.addEventListener("focus", syncFromStorage);

    return () => {
      window.removeEventListener("focus", syncFromStorage);
    };
  }, [storyId]);

  return (
    <AudioCutterDialog
      open={true}
      renderInDialog={false}
      onOpenChange={(nextOpen) => {
        if (nextOpen) return;
        router.push(
          shouldOpenBulkAudioOnReturnRef.current
            ? `/editor/course/${courseId}/story/${storyId}?bulkAudio=1`
            : `/editor/course/${courseId}/story/${storyId}`,
        );
      }}
      expectedSegmentCount={transcriptItems.length}
      transcriptItems={transcriptItems}
      onUseSegments={async (files) => {
        await storeAudioCutterOutput(storyId, files);
        shouldOpenBulkAudioOnReturnRef.current = true;
      }}
    />
  );
}
