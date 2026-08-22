"use client";

import EditorSearchInput from "@/app/editor/_components/editor_search_input";
import { storyListFilterCountClassName } from "./story_list_layout";

export type StoryState = "draft" | "feedback" | "finished" | "published";
export type StoryFilter = "all" | StoryState;
export type StoryFilterCounts = Record<StoryFilter, number>;

const STORY_FILTER_ORDER: StoryFilter[] = [
  "all",
  "draft",
  "feedback",
  "finished",
  "published",
];

const STORY_FILTER_PRESENTATION: Record<
  StoryFilter,
  { label: string; icon: string }
> = {
  all: { label: "All", icon: "📚" },
  draft: { label: "✍️ Draft", icon: "✍️" },
  feedback: { label: "🗨️ Feedback", icon: "🗨️" },
  finished: { label: "✅ Finished", icon: "✅" },
  published: { label: "📢 Published", icon: "📢" },
};

export default function StoryListToolbar({
  activeFilter = "all",
  counts,
  storySearch = "",
  loading = false,
  onFilterChange,
  onSearchChange,
}: {
  activeFilter?: StoryFilter;
  counts?: StoryFilterCounts;
  storySearch?: string;
  loading?: boolean;
  onFilterChange?: (filter: StoryFilter) => void;
  onSearchChange?: (value: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 max-[975px]:mb-1 max-[975px]:gap-1">
      <div className="w-full min-w-[220px] flex-1 min-[860px]:max-w-[360px]">
        <EditorSearchInput
          id={loading ? undefined : "story-search"}
          type="search"
          value={storySearch}
          placeholder="Search story names or status"
          aria-label={
            loading ? "Story search loading" : "Search story names or status"
          }
          autoComplete="off"
          disabled={loading}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 max-[975px]:-mx-3 max-[975px]:w-[calc(100%+1.5rem)] max-[975px]:flex-none max-[975px]:flex-nowrap max-[975px]:justify-start max-[975px]:gap-0 max-[975px]:overflow-x-auto max-[975px]:px-3">
        {STORY_FILTER_ORDER.map((filter) => {
          const isActive = activeFilter === filter;
          const presentation = STORY_FILTER_PRESENTATION[filter];
          return (
            <button
              key={filter}
              type="button"
              disabled={loading}
              className="group inline-flex shrink-0 items-center justify-center max-[975px]:min-h-11 max-[975px]:px-1"
              onClick={() => onFilterChange?.(filter)}
              aria-pressed={isActive}
              aria-label={
                loading
                  ? `${presentation.label}: loading`
                  : `${presentation.label}: ${counts?.[filter] ?? 0}`
              }
            >
              <span
                className={
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[14px] leading-none transition-colors duration-150 max-[975px]:gap-1.5 max-[975px]:px-2 max-[975px]:py-1.5 max-[975px]:text-[13px] " +
                  (isActive
                    ? "border-[var(--button-background)] bg-[var(--button-background)] text-[var(--button-color)]"
                    : "border-[var(--header-border)] bg-[var(--body-background-faint)] text-[var(--text-color)] group-hover:bg-[var(--body-background)]")
                }
              >
                <span className="max-[975px]:sr-only">
                  {presentation.label}
                </span>
                <span
                  aria-hidden="true"
                  className="hidden text-[18px] max-[975px]:inline max-[975px]:text-[16px]"
                >
                  {presentation.icon}
                </span>
                <span
                  className={
                    `${storyListFilterCountClassName} ` +
                    (isActive
                      ? "bg-[color:rgba(255,255,255,0.18)] text-[var(--button-color)]"
                      : "bg-[var(--body-background)] text-[var(--text-color-dim)]")
                  }
                >
                  {counts ? (
                    counts[filter]
                  ) : (
                    <span
                      aria-hidden="true"
                      className="block h-3 w-5 animate-pulse rounded bg-current opacity-20"
                    />
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
