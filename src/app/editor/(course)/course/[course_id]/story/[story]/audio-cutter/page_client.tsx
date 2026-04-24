"use client";

import React from "react";
import { EditorState } from "@codemirror/state";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import AudioCutterDialog from "@/app/editor/story/[story]/audio-cutter-dialog";
import {
  loadAudioCutterTranscript,
  storeAudioCutterTranscript,
  type AudioCutterPreparedSegment,
  type AudioCutterTranscriptItem,
} from "@/app/editor/story/[story]/audio-cutter-storage";
import type {
  DetailedCourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";
import type {
  Avatar,
  StoryEditorPageData,
} from "@/app/editor/story/[story]/types";
import { Breadcrumbs } from "@/app/editor/_components/breadcrumbs";
import {
  EditorHeaderActions,
  EditorHeaderBreadcrumbs,
} from "@/app/editor/_components/header_context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import type {
  StoryElement,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { timings_to_text } from "@/lib/editor/audio/audio_edit_tools";

export default function AudioCutterPageClient({
  storyId,
  courseId,
}: {
  storyId: number;
  courseId: string;
}) {
  const router = useRouter();
  const [transcriptItems, setTranscriptItems] = React.useState<
    AudioCutterTranscriptItem[]
  >([]);
  const [saveProgress, setSaveProgress] = React.useState<{
    total: number;
    uploaded: number;
    phase: "idle" | "uploading" | "saving";
  }>({
    total: 0,
    uploaded: 0,
    phase: "idle",
  });
  const [saveSuccessOpen, setSaveSuccessOpen] = React.useState(false);
  const setStoryMutation = useMutation(api.storyWrite.setStory);
  const data = useQuery(api.editorRead.getEditorStoryPageData, {
    storyId,
  }) as StoryEditorPageData | null | undefined;
  const effectiveCourseId =
    data?.story_data.short && data.story_data.short !== courseId
      ? data.story_data.short
      : courseId;
  const course = useQuery(
    api.editorRead.getEditorCourseByIdentifier,
    effectiveCourseId ? { identifier: effectiveCourseId } : "skip",
  ) as DetailedCourseProps | null | undefined;
  const stories = useQuery(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    effectiveCourseId ? { identifier: effectiveCourseId } : "skip",
  ) as StoryListDataProps[] | undefined;
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    data ? { languageLegacyId: data.story_data.learning_language } : "skip",
  ) as Avatar[] | undefined;
  const learningLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    data ? { legacyLanguageId: data.story_data.learning_language } : "skip",
  ) as LanguageData | null | undefined;
  const fromLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    data ? { legacyLanguageId: data.story_data.from_language } : "skip",
  ) as LanguageData | null | undefined;

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

  const storyIndex =
    stories?.findIndex((story) => story.id === data?.story_data.id) ?? -1;
  const previousStory = storyIndex > 0 ? stories?.[storyIndex - 1] : null;
  const nextStory =
    storyIndex >= 0 && stories && storyIndex < stories.length - 1
      ? stories[storyIndex + 1]
      : null;
  const nextStoryData = useQuery(
    api.editorRead.getEditorStoryPageData,
    nextStory ? { storyId: nextStory.id } : "skip",
  ) as StoryEditorPageData | null | undefined;
  const nextAvatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageLegacyId,
    nextStoryData
      ? { languageLegacyId: nextStoryData.story_data.learning_language }
      : "skip",
  ) as Avatar[] | undefined;
  const nextLearningLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    nextStoryData
      ? { legacyLanguageId: nextStoryData.story_data.learning_language }
      : "skip",
  ) as LanguageData | null | undefined;
  const nextFromLanguage = useQuery(
    api.editorRead.getEditorLanguageByLegacyId,
    nextStoryData
      ? { legacyLanguageId: nextStoryData.story_data.from_language }
      : "skip",
  ) as LanguageData | null | undefined;
  const coursePathId = course?.short ?? effectiveCourseId;
  const saveProgressLabel =
    saveProgress.phase === "uploading"
      ? `Saving to story (${saveProgress.uploaded}/${saveProgress.total} uploaded)...`
      : saveProgress.phase === "saving"
        ? `Saving to story (${saveProgress.total}/${saveProgress.total} uploaded)...`
        : undefined;
  const footerStatusText =
    saveProgress.phase === "idle"
      ? "Upload the generated clips and insert their audio refs directly into the story."
      : saveProgress.phase === "uploading"
        ? `Uploading ${saveProgress.uploaded} of ${saveProgress.total} audio files to the story...`
        : "Writing updated audio refs and speech marks into the story...";
  const nextStoryTranscriptItems = React.useMemo(() => {
    if (
      !nextStoryData ||
      !nextAvatarRows ||
      !nextLearningLanguage ||
      !nextFromLanguage
    ) {
      return null;
    }

    const avatarNames: Record<number, Avatar> = {};
    for (const avatar of nextAvatarRows) {
      avatarNames[avatar.avatar_id] = avatar;
    }

    const [parsedStory] = processStoryFile(
      nextStoryData.story_data.text,
      nextStoryData.story_data.id,
      avatarNames,
      {
        learning_language: nextLearningLanguage.short,
        from_language: nextFromLanguage.short,
      },
      nextLearningLanguage.tts_replace ?? "",
    );

    return getAudioCutterTranscriptItems(parsedStory.elements);
  }, [nextAvatarRows, nextFromLanguage, nextLearningLanguage, nextStoryData]);
  const canContinueToNextStory = Boolean(nextStory && nextStoryTranscriptItems);

  const goToStoryPage = React.useCallback(() => {
    setSaveSuccessOpen(false);
    router.push(`/editor/course/${coursePathId ?? courseId}/story/${storyId}`);
  }, [courseId, coursePathId, router, storyId]);

  const continueToNextStory = React.useCallback(() => {
    if (!nextStory || !nextStoryTranscriptItems) return;

    storeAudioCutterTranscript(nextStory.id, nextStoryTranscriptItems);
    setSaveSuccessOpen(false);
    router.push(
      `/editor/course/${coursePathId ?? courseId}/story/${nextStory.id}/audio-cutter`,
    );
  }, [courseId, coursePathId, nextStory, nextStoryTranscriptItems, router]);

  return (
    <>
      {course && data ? (
        <EditorHeaderBreadcrumbs>
          <Breadcrumbs
            path={[
              { type: "Editor", href: `/editor` },
              { type: "sep", href: "#" },
              {
                type: "course",
                lang1: {
                  languageId: course.learningLanguageId,
                  name: course.learning_language_name,
                },
                lang2: {
                  languageId: course.fromLanguageId,
                  name: course.from_language_name,
                },
                href: coursePathId
                  ? `/editor/course/${coursePathId}`
                  : undefined,
              },
              { type: "sep", href: "#" },
              {
                type: "story",
                href: coursePathId
                  ? `/editor/course/${coursePathId}/story/${storyId}`
                  : undefined,
                data: data.story_data,
              },
              { type: "sep", href: "#" },
              { type: "Audio cutter" },
            ]}
          />
        </EditorHeaderBreadcrumbs>
      ) : null}
      <EditorHeaderActions>
        <div className="flex items-center">
          <StoryNavButton
            href={
              previousStory && coursePathId
                ? `/editor/course/${coursePathId}/story/${previousStory.id}/audio-cutter`
                : undefined
            }
            label="Previous"
            title={previousStory?.name}
            compactIconDirection="left"
          />
          <StoryNavButton
            href={
              nextStory && coursePathId
                ? `/editor/course/${coursePathId}/story/${nextStory.id}/audio-cutter`
                : undefined
            }
            label="Next"
            title={nextStory?.name}
            compactIconDirection="right"
          />
        </div>
      </EditorHeaderActions>
      <AudioCutterDialog
        open={true}
        renderInDialog={false}
        onOpenChange={(nextOpen) => {
          if (nextOpen) return;
          router.push(
            `/editor/course/${coursePathId ?? courseId}/story/${storyId}`,
          );
        }}
        expectedSegmentCount={transcriptItems.length}
        transcriptItems={transcriptItems}
        primaryActionLabel="Save segments to story"
        primaryActionPendingLabel={saveProgressLabel}
        footerStatusText={footerStatusText}
        onUseSegments={async (segments) => {
          if (!data) {
            throw new Error("Story data is still loading.");
          }
          if (!learningLanguage || !fromLanguage) {
            throw new Error("Language data is still loading.");
          }
          if (!avatarRows) {
            throw new Error("Avatar data is still loading.");
          }
          if (segments.length === 0) return;
          if (transcriptItems.some((item) => !item.ssml)) {
            throw new Error(
              "This cutter session is missing story audio anchors. Reopen the cutter from the story editor and try again.",
            );
          }
          if (data.story_data.official && !data.isAdmin) {
            throw new Error(
              "Official stories cannot be overwritten unless you are an admin.",
            );
          }
          if (data.story_data.official) {
            const confirmed = window.confirm(
              "This is an official story. Saving will overwrite it. Continue?",
            );
            if (!confirmed) {
              return false;
            }
          }

          const uploadedSegments: UploadedSegment[] = [];
          setSaveProgress({
            total: segments.length,
            uploaded: 0,
            phase: "uploading",
          });

          try {
            for (const [index, segment] of segments.entries()) {
              const uploadedFilename = stripAudioPathPrefix(
                await uploadAudioFile(segment.file, storyId),
              );
              uploadedSegments.push({
                ...segment,
                uploadedFilename,
              });
              setSaveProgress({
                total: segments.length,
                uploaded: index + 1,
                phase: "uploading",
              });
            }

            setSaveProgress({
              total: segments.length,
              uploaded: segments.length,
              phase: "saving",
            });

            const avatarNames: Record<number, Avatar> = {};
            for (const avatar of avatarRows) {
              avatarNames[avatar.avatar_id] = avatar;
            }

            const [, , audioInsertLines] = processStoryFile(
              data.story_data.text,
              data.story_data.id,
              avatarNames,
              {
                learning_language: learningLanguage.short,
                from_language: fromLanguage.short,
              },
              learningLanguage.tts_replace ?? "",
            );

            const storyText = applyAudioUpdatesToText(
              data.story_data.text,
              uploadedSegments.map((segment) => ({
                ssml: segment.ssml,
                serializedText: timings_to_text({
                  filename: segment.uploadedFilename,
                  keypoints: segment.keypoints,
                }),
              })),
              audioInsertLines,
            );

            const [nextParsedStoryBase, nextParsedMeta] = processStoryFile(
              storyText,
              data.story_data.id,
              avatarNames,
              {
                learning_language: learningLanguage.short,
                from_language: fromLanguage.short,
              },
              learningLanguage.tts_replace ?? "",
            );

            await setStoryMutation({
              legacyStoryId: data.story_data.id,
              duo_id: data.story_data.duo_id ?? "",
              name: nextParsedMeta.fromLanguageName,
              image: nextParsedMeta.icon ?? "",
              set_id: nextParsedMeta.set_id,
              set_index: nextParsedMeta.set_index,
              legacyCourseId: data.story_data.course_id,
              text: storyText,
              json: toConvexValue(nextParsedStoryBase),
              todo_count: nextParsedMeta.todo_count,
              change_date: new Date().toISOString(),
              confirmOfficialOverwrite: data.story_data.official || undefined,
              operationKey: `story:${data.story_data.id}:audio-cutter:${Date.now()}`,
            });
            setSaveSuccessOpen(true);
            return false;
          } finally {
            setSaveProgress({
              total: 0,
              uploaded: 0,
              phase: "idle",
            });
          }
        }}
      />
      <Dialog open={saveSuccessOpen} onOpenChange={setSaveSuccessOpen}>
        <DialogContent className="max-w-[520px]">
          <DialogTitle className="text-lg font-semibold text-[var(--text-color)]">
            Segments saved to story
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-color-dim)]">
            {data?.story_data.name
              ? `The generated audio files and speech marks were saved to "${data.story_data.name}".`
              : "The generated audio files and speech marks were saved to the story."}
          </DialogDescription>
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--color_base_border)] bg-[var(--body-background-faint)] px-3 text-sm font-medium leading-none transition-colors hover:bg-[var(--color_base_background)]"
              onClick={goToStoryPage}
            >
              Show story
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md border border-[#0f5f83] bg-[#1cb0f6] px-3 text-sm font-semibold leading-none text-white transition-colors hover:bg-[#1598d7] disabled:cursor-default disabled:opacity-70"
              onClick={continueToNextStory}
              disabled={!canContinueToNextStory}
            >
              {nextStory
                ? canContinueToNextStory
                  ? "Continue with next story"
                  : "Preparing next story..."
                : "No next story"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type LanguageData = {
  short: string;
  rtl: boolean;
  tts_replace: string | null;
};

type UploadedSegment = AudioCutterPreparedSegment & {
  uploadedFilename: string;
};

function getElementAudio(
  element: StoryElementLine | StoryElementHeader | undefined,
) {
  if (!element) return undefined;
  if (element.type === "HEADER") return element.audio;
  return element.line.content.audio ?? element.audio;
}

function getAudioCutterTranscriptItems(elements: StoryElement[]) {
  const items: AudioCutterTranscriptItem[] = [];
  let order = 1;

  for (const element of elements) {
    if (element.type !== "HEADER" && element.type !== "LINE") continue;
    const audio = getElementAudio(element);
    if (!audio?.ssml) continue;

    const text =
      element.type === "HEADER"
        ? element.learningLanguageTitleContent?.text
        : element.line.content?.text;
    const content =
      element.type === "HEADER"
        ? element.learningLanguageTitleContent
        : element.line.content;
    const speaker =
      element.type === "HEADER"
        ? "Narrator"
        : element.line.type === "CHARACTER"
          ? (element.line.characterName ??
            element.line.characterId?.toString() ??
            "Narrator")
          : "Narrator";

    if (!text || !content) continue;

    items.push({
      id: `${element.type}-${element.trackingProperties.line_index}-${audio.ssml.inser_index}`,
      order,
      lineIndex: element.trackingProperties.line_index || 0,
      type: element.type,
      speaker,
      content,
      existingFilename: audio.url?.replace(/^audio\//, "") ?? "",
      existingKeypoints: audio.keypoints ?? [],
      ssml: audio.ssml,
    });
    order += 1;
  }

  return items;
}

function stripAudioPathPrefix(filename: string) {
  if (!filename) return "";
  if (filename.startsWith("audio/")) {
    return filename.slice("audio/".length);
  }
  return filename;
}

async function uploadAudioFile(file: File, storyId: number) {
  const data = new FormData();
  data.set("file", file);
  data.set("story_id", String(storyId));

  const response = await fetch("/audio/upload", {
    method: "POST",
    body: data,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as {
    success?: boolean;
    filename?: string;
  };

  if (!payload.success || !payload.filename) {
    throw new Error("Upload failed.");
  }

  return payload.filename;
}

function applyAudioUpdatesToText(
  docText: string,
  updates: { serializedText: string; ssml: { inser_index: number } }[],
  audioInsertLines: [number | undefined, number][],
) {
  const state = EditorState.create({ doc: docText });
  const changes = updates
    .map((update) => {
      const insertTarget = audioInsertLines[update.ssml.inser_index];
      if (!insertTarget) return null;

      const [line, lineInsert] = insertTarget;
      if (line !== undefined) {
        const lineNumber = Math.min(Math.max(1, line), state.doc.lines);
        const lineState = state.doc.line(lineNumber);
        return {
          from: lineState.from,
          to: lineState.to,
          insert: update.serializedText,
        };
      }

      const lineInsertNumber = Math.min(
        Math.max(1, lineInsert - 1),
        state.doc.lines,
      );
      const lineState = state.doc.line(lineInsertNumber);
      return {
        from: lineState.from,
        to: lineState.from,
        insert: `${update.serializedText}\n`,
      };
    })
    .filter((change): change is NonNullable<typeof change> => change !== null)
    .sort((left, right) => left.from - right.from || left.to - right.to);

  if (changes.length === 0) return docText;

  return state.update({ changes }).state.doc.toString();
}

function toConvexValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (Array.isArray(value)) return value.map((item) => toConvexValue(item));
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = toConvexValue(item);
    }
    return result;
  }
  return value;
}

function StoryNavButton({
  href,
  label,
  title,
  compactIconDirection,
}: {
  href?: string;
  label: string;
  title?: string;
  compactIconDirection: "left" | "right";
}) {
  const className =
    "px-3 py-2 text-center text-sm text-[var(--text-color-dim)] no-underline transition-colors hover:text-[var(--text-color)]";
  const content = (
    <>
      <span className="max-[1100px]:hidden">{label}</span>
      <span className="min-[1101px]:hidden">
        <ChevronIcon direction={compactIconDirection} />
      </span>
    </>
  );

  if (!href) {
    return (
      <span
        className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px] cursor-default opacity-50`}
        aria-disabled="true"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px]`}
      title={title ? `${label}: ${title}` : label}
    >
      {content}
    </Link>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <span aria-hidden="true" className="text-lg leading-none">
      {direction === "left" ? "‹" : "›"}
    </span>
  );
}
