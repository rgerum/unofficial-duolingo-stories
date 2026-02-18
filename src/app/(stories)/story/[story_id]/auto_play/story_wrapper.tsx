"use client";
import React from "react";

import StoryAutoPlay from "@/components/StoryAutoPlay";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getCustomStoryPlaylist,
  listCustomStoryPlaylists,
  type CustomStoryPlaylist,
} from "@/lib/storyPlaylists";

type QueueMode = "course" | "set" | "custom";
type LoopMode = "off" | "all" | "one";

function normalizeMode(value: string | null): QueueMode {
  if (value === "set") return "set";
  if (value === "custom") return "custom";
  return "course";
}

function normalizeLoop(value: string | null): LoopMode {
  if (value === "all") return "all";
  if (value === "one") return "one";
  return "off";
}

function seededShuffle(values: number[], seedInput: number) {
  let seed = seedInput;
  const result = [...values];
  function random() {
    seed = Math.sin(seed) * 10000;
    return seed - Math.floor(seed);
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export default function StoryWrapper({ storyId }: { storyId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const story = useQuery(api.storyRead.getStoryByLegacyId, { storyId });
  const courseData = useQuery(
    api.landing.getPublicCoursePageData,
    story ? { short: story.course_short } : "skip",
  );
  const [customPlaylists, setCustomPlaylists] = React.useState<CustomStoryPlaylist[]>(
    [],
  );

  React.useEffect(() => {
    if (!story?.course_short) return;
    setCustomPlaylists(listCustomStoryPlaylists(story.course_short));
  }, [story?.course_short]);

  const mode = normalizeMode(searchParams.get("mode"));
  const loopMode = normalizeLoop(searchParams.get("loop"));
  const shuffleEnabled = searchParams.get("shuffle") === "1";
  const setIdParam = Number.parseInt(searchParams.get("setId") ?? "", 10);
  const setId = Number.isFinite(setIdParam) ? setIdParam : null;
  const playlistId = searchParams.get("playlistId") ?? "";
  const seedParam = Number.parseInt(searchParams.get("seed") ?? "", 10);
  const shuffleSeed = Number.isFinite(seedParam) ? seedParam : null;

  const queue = React.useMemo(() => {
    if (!story) return [];
    const allCourseStoryIds =
      courseData?.stories.map((courseStory) => courseStory.id) ?? [];
    const storyInCourse = allCourseStoryIds.includes(story.id);
    let baseQueue: number[] = [];

    if (mode === "set" && setId !== null) {
      baseQueue =
        courseData?.stories
          .filter((courseStory) => courseStory.set_id === setId)
          .map((courseStory) => courseStory.id) ?? [];
    } else if (mode === "custom" && playlistId) {
      const customPlaylist = getCustomStoryPlaylist(playlistId);
      const allowed = new Set(allCourseStoryIds);
      baseQueue = customPlaylist
        ? customPlaylist.storyIds.filter((id) => allowed.has(id))
        : [];
    } else {
      baseQueue = allCourseStoryIds;
    }

    if (baseQueue.length === 0) {
      baseQueue = storyInCourse ? [story.id] : allCourseStoryIds;
    }

    if (!baseQueue.includes(story.id)) {
      baseQueue = [story.id, ...baseQueue];
    }

    const uniqueQueue = Array.from(new Set(baseQueue));
    if (!shuffleEnabled) return uniqueQueue;

    return seededShuffle(uniqueQueue, shuffleSeed ?? story.id);
  }, [
    courseData?.stories,
    mode,
    playlistId,
    setId,
    shuffleEnabled,
    shuffleSeed,
    story,
  ]);

  const queueIndex = React.useMemo(() => {
    if (!story) return 0;
    const found = queue.indexOf(story.id);
    return found === -1 ? 0 : found;
  }, [queue, story]);

  const canGoPrev = queue.length > 1 && (loopMode === "all" || queueIndex > 0);
  const canGoNext =
    queue.length > 1 && (loopMode === "all" || loopMode === "one" || queueIndex < queue.length - 1);

  function buildSearchParams(
    next: Partial<{
      mode: QueueMode;
      setId: number | null;
      playlistId: string;
      loop: LoopMode;
      shuffle: boolean;
      seed: number | null;
    }>,
  ) {
    const params = new URLSearchParams(searchParams.toString());
    const nextMode = next.mode ?? mode;
    const nextLoop = next.loop ?? loopMode;
    const nextShuffle = next.shuffle ?? shuffleEnabled;
    const nextSetId = next.setId === undefined ? setId : next.setId;
    const nextPlaylistId = next.playlistId ?? playlistId;
    const nextSeed = next.seed === undefined ? shuffleSeed : next.seed;

    params.set("mode", nextMode);
    params.set("loop", nextLoop);
    params.set("shuffle", nextShuffle ? "1" : "0");
    if (nextSetId === null || nextMode !== "set") params.delete("setId");
    else params.set("setId", String(nextSetId));
    if (!nextPlaylistId || nextMode !== "custom") params.delete("playlistId");
    else params.set("playlistId", nextPlaylistId);
    if (!nextShuffle) params.delete("seed");
    else params.set("seed", String(nextSeed ?? Date.now()));

    return params;
  }

  function goToStory(nextStoryId: number, updates: Parameters<typeof buildSearchParams>[0] = {}) {
    const params = buildSearchParams(updates);
    router.push(`/story/${nextStoryId}/auto_play?${params.toString()}`);
  }

  function goNext() {
    if (!story || queue.length === 0) return;
    if (loopMode === "one") {
      goToStory(story.id);
      return;
    }
    const atEnd = queueIndex >= queue.length - 1;
    if (atEnd) {
      if (loopMode === "all") goToStory(queue[0]);
      return;
    }
    goToStory(queue[queueIndex + 1]);
  }

  function handleStoryFinished() {
    if (!story || queue.length === 0) return;
    if (loopMode === "one") {
      goToStory(story.id);
      return;
    }
    const atEnd = queueIndex >= queue.length - 1;
    if (atEnd) {
      if (loopMode === "all") goToStory(queue[0]);
      return;
    }
    goToStory(queue[queueIndex + 1]);
  }

  function goPrev() {
    if (!story || queue.length === 0) return;
    const atStart = queueIndex <= 0;
    if (atStart) {
      if (loopMode === "all") goToStory(queue[queue.length - 1]);
      return;
    }
    goToStory(queue[queueIndex - 1]);
  }

  if (story === undefined) return null;
  if (story === null) return <p>Story not found.</p>;

  return (
    <div className="pb-10">
      <StoryAutoPlay
        story={story}
        onFinished={handleStoryFinished}
        queueLabel={`Queue: ${queueIndex + 1}/${Math.max(queue.length, 1)} (${mode})`}
        queueSubLabel={
          mode === "custom"
            ? customPlaylists.some((playlist) => playlist.id === playlistId)
              ? `Custom playlist: ${customPlaylists.find((playlist) => playlist.id === playlistId)?.name ?? ""}`
              : "Custom playlist not found for this course."
            : undefined
        }
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={goPrev}
        onNext={goNext}
        shuffleEnabled={shuffleEnabled}
        onToggleShuffle={() => {
          const nextShuffle = !shuffleEnabled;
          goToStory(story.id, {
            shuffle: nextShuffle,
            seed: nextShuffle ? Date.now() : null,
          });
        }}
        loopMode={loopMode}
        onToggleLoop={() => {
          const order: LoopMode[] = ["off", "all", "one"];
          const nextLoop = order[(order.indexOf(loopMode) + 1) % order.length];
          goToStory(story.id, { loop: nextLoop });
        }}
        courseOverviewHref={`/${story.course_short}`}
      />
    </div>
  );
}
