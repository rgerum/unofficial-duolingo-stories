"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { processStoryFile } from "@/components/editor/story/syntax_parser_new";
import StoryProgress from "@/components/StoryProgress";
import type { Avatar } from "@/app/editor/story/[story]/types";
import type { StoryData } from "@/app/(stories)/story/[story_id]/getStory";
import type { Id } from "@convex/_generated/dataModel";

const NEWS_ILLUSTRATION =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="16" fill="#e8f4fd"/><rect x="20" y="18" width="80" height="84" rx="6" fill="white" stroke="#1cb0f6" stroke-width="2"/><rect x="30" y="28" width="60" height="10" rx="2" fill="#1cb0f6"/><rect x="30" y="46" width="35" height="4" rx="1" fill="#ccc"/><rect x="30" y="54" width="60" height="4" rx="1" fill="#ccc"/><rect x="30" y="62" width="50" height="4" rx="1" fill="#ccc"/><rect x="30" y="70" width="55" height="4" rx="1" fill="#ccc"/><rect x="30" y="78" width="40" height="4" rx="1" fill="#ccc"/><rect x="30" y="86" width="60" height="4" rx="1" fill="#ccc"/></svg>`,
  );

const LEVELS = ["A1", "A2", "B1", "B2"] as const;
const LEVEL_LABELS: Record<string, { label: string; color: string; description: string }> = {
  A1: { label: "A1", color: "#58cc02", description: "Beginner" },
  A2: { label: "A2", color: "#1cb0f6", description: "Elementary" },
  B1: { label: "B1", color: "#ff9600", description: "Intermediate" },
  B2: { label: "B2", color: "#ff4b4b", description: "Upper Intermediate" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

type ViewState =
  | { mode: "browse" }
  | { mode: "play"; storyId: Id<"news_stories">; level: string; date: string };

export default function NewsPreviewPage() {
  const [viewState, setViewState] = React.useState<ViewState>({ mode: "browse" });
  const [selectedDate, setSelectedDate] = React.useState(getTodayDate());
  const language = "fr";
  const fromLanguage = "en";

  // Fetch stories for selected date
  const storiesForDate = useQuery(api.newsStories.getByDate, {
    date: selectedDate,
    language,
  });

  // Fetch available dates for archive
  const availableDates = useQuery(api.newsStories.getAvailableDates, {
    language,
  });

  // Load avatars for French
  const avatarRows = useQuery(
    api.editorRead.getEditorAvatarNamesByLanguageShort,
    { languageShort: language },
  );

  const avatarNames: Record<number, Avatar> = React.useMemo(() => {
    const map: Record<number, Avatar> = {};
    if (avatarRows) {
      for (const avatar of avatarRows as Avatar[]) {
        map[avatar.avatar_id] = avatar;
      }
    }
    return map;
  }, [avatarRows]);

  if (viewState.mode === "play") {
    return (
      <StoryPlayer
        storyId={viewState.storyId}
        level={viewState.level}
        date={viewState.date}
        language={language}
        fromLanguage={fromLanguage}
        avatarNames={avatarNames}
        onBack={() => setViewState({ mode: "browse" })}
      />
    );
  }

  const storiesByLevel: Record<string, { _id: Id<"news_stories">; level: string }> = {};
  if (storiesForDate) {
    for (const story of storiesForDate as Array<{ _id: Id<"news_stories">; level: string }>) {
      storiesByLevel[story.level] = story;
    }
  }

  const isToday = selectedDate === getTodayDate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            📰 News Stories — French
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            AI-generated language learning stories based on today&apos;s news
          </p>
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Test preview — this feature is under development
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8">
        {/* Date selector */}
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-700 dark:text-gray-200">
            {isToday ? "Today's Stories" : formatDate(selectedDate)}
          </h2>

          {/* Level buttons */}
          <div className="grid grid-cols-2 gap-4">
            {LEVELS.map((level) => {
              const info = LEVEL_LABELS[level];
              const story = storiesByLevel[level];
              const isAvailable = !!story;

              return (
                <button
                  key={level}
                  onClick={() => {
                    if (story) {
                      setViewState({
                        mode: "play",
                        storyId: story._id,
                        level,
                        date: selectedDate,
                      });
                    }
                  }}
                  disabled={!isAvailable}
                  className={`rounded-xl border-2 p-6 text-left transition-all ${
                    isAvailable
                      ? "cursor-pointer border-gray-200 bg-white hover:border-gray-300 hover:shadow-md dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
                      : "cursor-not-allowed border-gray-100 bg-gray-50 opacity-50 dark:border-gray-700 dark:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ backgroundColor: info.color }}
                    >
                      {info.label}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">
                        {info.description}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isAvailable ? "Tap to play" : "Not yet generated"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {storiesForDate && storiesForDate.length === 0 && (
            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              No stories generated for this date yet.
            </p>
          )}
        </div>

        {/* Archive */}
        {availableDates && (availableDates as string[]).length > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Archive
            </h3>
            <div className="flex flex-wrap gap-2">
              {(availableDates as string[]).map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    date === selectedDate
                      ? "bg-[#1cb0f6] font-semibold text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {date === getTodayDate() ? "Today" : date}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Story Player Component ----

function StoryPlayer({
  storyId,
  level,
  date,
  language,
  fromLanguage,
  avatarNames,
  onBack,
}: {
  storyId: Id<"news_stories">;
  level: string;
  date: string;
  language: string;
  fromLanguage: string;
  avatarNames: Record<number, Avatar>;
  onBack: () => void;
}) {
  const content = useQuery(api.newsStories.getContent, { newsStoryId: storyId });
  const [highlightName, setHighlightName] = React.useState<string[]>([]);
  const [hideNonHighlighted, setHideNonHighlighted] = React.useState(false);

  const storyData: StoryData | null = React.useMemo(() => {
    if (!content?.storyText) return null;

    const [story, meta] = processStoryFile(
      content.storyText,
      0,
      avatarNames,
      { learning_language: language, from_language: fromLanguage },
      "",
    );

    // Inject audio URLs from Convex storage
    const audioUrls = (content.audioUrls ?? {}) as Record<number, string>;
    const elements = story.elements.map((el) => {
      if (el.type === "HEADER") {
        const patched = { ...el, illustrationUrl: NEWS_ILLUSTRATION };
        const audioUrl = audioUrls[el.trackingProperties.line_index];
        if (audioUrl && patched.learningLanguageTitleContent) {
          patched.learningLanguageTitleContent = {
            ...patched.learningLanguageTitleContent,
            audio: {
              ssml: { text: "", speaker: "", id: 0 },
              url: audioUrl,
              keypoints: undefined,
            },
          };
        }
        return patched;
      }
      if (el.type === "LINE") {
        const audioUrl = audioUrls[el.trackingProperties.line_index];
        if (audioUrl && el.line?.content) {
          return {
            ...el,
            line: {
              ...el.line,
              content: {
                ...el.line.content,
                audio: {
                  ssml: { text: "", speaker: "", id: 0 },
                  url: audioUrl,
                  keypoints: undefined,
                },
              },
            },
          };
        }
      }
      return el;
    });

    return {
      id: 0,
      set_id: 0,
      course_id: 0,
      from_language: fromLanguage,
      from_language_id: 0,
      from_language_long: "English",
      from_language_rtl: false,
      from_language_name: meta.fromLanguageName || "News Story",
      learning_language: language,
      learning_language_long: "French",
      learning_language_rtl: false,
      course_short: `${language}-${fromLanguage}`,
      elements,
      illustrations: {
        gilded: NEWS_ILLUSTRATION,
        active: NEWS_ILLUSTRATION,
        locked: NEWS_ILLUSTRATION,
      },
    } as StoryData;
  }, [content, avatarNames, language, fromLanguage]);

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-3 text-gray-500">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-[#1cb0f6]" />
          Loading story...
        </div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Story content could not be loaded.</p>
        <button onClick={onBack} className="mt-4 text-[#1cb0f6] hover:underline">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Minimal header with back button */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={onBack}
          className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ← Back
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {date} · {LEVEL_LABELS[level]?.description ?? level}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <StoryProgress
          story={storyData}
          settings={{
            hide_questions: false,
            show_all: false,
            show_names: false,
            rtl: false,
            highlight_name: highlightName,
            hideNonHighlighted: hideNonHighlighted,
            setHighlightName: setHighlightName,
            setHideNonHighlighted: setHideNonHighlighted,
            id: 0,
            show_title_page: true,
          }}
          onEnd={() => {
            console.log("[news-preview] Story completed!");
            onBack();
          }}
        />
      </div>
    </div>
  );
}
