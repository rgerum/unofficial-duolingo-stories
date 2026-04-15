"use client";

import React, { startTransition } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "convex/react";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CornerDownLeftIcon,
  SearchIcon,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSelectedLayoutSegments,
} from "next/navigation";
import { api } from "@convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import Input from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import LanguageFlag from "@/components/ui/language-flag";
import { formatStorySetLabel, matchesStorySearch } from "@/lib/story-search";
import { cn } from "@/lib/utils";
import type {
  CourseProps,
  StoryListDataProps,
} from "@/app/editor/(course)/types";

type PaletteItem = {
  id: string;
  kind: "course" | "story" | "course-overview";
  label: string;
  subtitle: string;
  meta?: string;
  course?: CourseProps;
  story?: StoryListDataProps;
};

export default function EditorCommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSelectedLayoutSegments();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const scrollViewportRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [shortcutLabel, setShortcutLabel] = React.useState("Ctrl");
  const [selectedCourseKey, setSelectedCourseKey] = React.useState<
    string | null
  >(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const previousPathnameRef = React.useRef(pathname);
  const courseSegment = segments[1] ?? null;
  const nestedRoute = segments[2] ?? null;
  const showTrigger = nestedRoute !== "story";
  const sidebarData = useQuery(api.editorRead.getEditorSidebarData, {});
  const courses = (sidebarData?.courses ?? []) as CourseProps[];

  let currentCourse: CourseProps | null = null;
  for (const course of courses) {
    if (course.short === courseSegment || String(course.id) === courseSegment) {
      currentCourse = course;
      break;
    }
  }

  let selectedCourse: CourseProps | null = null;
  for (const course of courses) {
    if (getCourseKey(course) === selectedCourseKey) {
      selectedCourse = course;
      break;
    }
  }

  const storyCourse = selectedCourse ?? currentCourse;
  const storyCourseIdentifier = storyCourse
    ? getCourseIdentifier(storyCourse)
    : null;
  const storyResults = useQuery(
    api.editorRead.getEditorStoriesByCourseLegacyId,
    storyCourseIdentifier ? { identifier: storyCourseIdentifier } : "skip",
  ) as StoryListDataProps[] | undefined;

  React.useEffect(() => {
    setShortcutLabel(
      /Mac|iPhone|iPad/.test(window.navigator.platform) ? "Cmd" : "Ctrl",
    );
  }, []);

  React.useEffect(() => {
    function handleGlobalKeydown(event: KeyboardEvent) {
      if (
        !event.key ||
        event.key.toLocaleLowerCase() !== "k" ||
        (!event.metaKey && !event.ctrlKey) ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      event.preventDefault();
      openPaletteInstant(
        currentCourse,
        setOpen,
        setQuery,
        setSelectedCourseKey,
        setActiveIndex,
      );
    }

    window.addEventListener("keydown", handleGlobalKeydown);
    return () => window.removeEventListener("keydown", handleGlobalKeydown);
  }, [currentCourse]);

  React.useEffect(() => {
    if (!open) return;

    const shouldSelectText = selectedCourseKey === null;
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      if (shouldSelectText) {
        inputRef.current?.select();
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open, selectedCourseKey]);

  React.useEffect(() => {
    if (pathname === previousPathnameRef.current) return;

    previousPathnameRef.current = pathname;
    setOpen(false);
    resetPaletteState(setQuery, setSelectedCourseKey, setActiveIndex);
  }, [pathname]);

  const trimmedQuery = query.trim();
  const normalizedCourseQuery = trimmedQuery.toLocaleLowerCase();

  const items: Array<PaletteItem> = [];

  if (selectedCourse) {
    if (trimmedQuery === "") {
      items.push({
        id: `course-overview:${getCourseKey(selectedCourse)}`,
        kind: "course-overview",
        label: `${selectedCourse.learning_language_name} [${selectedCourse.from_language_short}]`,
        subtitle: "Open course overview",
        meta: `${selectedCourse.count} stories`,
        course: selectedCourse,
      });
    }

    for (const story of storyResults ?? []) {
      if (!matchesStorySearch(story, trimmedQuery)) continue;
      items.push({
        id: `story:${story.id}`,
        kind: "story",
        label: story.name,
        subtitle: `Set ${formatStorySetLabel(story)}`,
        meta: story.todo_count ? `TODO ${story.todo_count}` : undefined,
        course: selectedCourse,
        story,
      });
    }
  } else {
    const currentCourseKey = currentCourse ? getCourseKey(currentCourse) : null;

    if (
      currentCourse &&
      matchesCourseSearch(currentCourse, normalizedCourseQuery)
    ) {
      items.push({
        id: `course:${currentCourseKey}`,
        kind: "course",
        label: `${currentCourse.learning_language_name} [${currentCourse.from_language_short}]`,
        subtitle: `Current course • ${currentCourse.from_language_name}`,
        meta: `${currentCourse.count} stories`,
        course: currentCourse,
      });
    }

    for (const course of courses) {
      const courseKey = getCourseKey(course);
      if (courseKey === currentCourseKey) continue;
      if (!matchesCourseSearch(course, normalizedCourseQuery)) continue;

      items.push({
        id: `course:${courseKey}`,
        kind: "course",
        label: `${course.learning_language_name} [${course.from_language_short}]`,
        subtitle: course.from_language_name,
        meta: `${course.count} stories`,
        course,
      });
    }
  }

  React.useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length);
    setActiveIndex((currentIndex) => {
      if (items.length === 0) return 0;
      if (currentIndex >= items.length) return items.length - 1;
      return currentIndex;
    });
  }, [items.length]);

  const listVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollViewportRef.current,
    estimateSize: () => 76,
    overscan: 6,
  });

  React.useEffect(() => {
    if (items.length === 0) return;

    listVirtualizer.scrollToIndex(activeIndex, {
      align: "auto",
    });
  }, [activeIndex, items.length, listVirtualizer]);

  function onOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      openPaletteInstant(
        currentCourse,
        setOpen,
        setQuery,
        setSelectedCourseKey,
        setActiveIndex,
      );
      return;
    }

    setOpen(false);
    resetPaletteState(setQuery, setSelectedCourseKey, setActiveIndex);
  }

  function onSelectItem(item: PaletteItem) {
    if (item.kind === "course" && item.course) {
      setSelectedCourseKey(getCourseKey(item.course));
      setQuery("");
      setActiveIndex(0);
      return;
    }

    if (item.kind === "course-overview" && item.course) {
      const courseIdentifier = getCourseIdentifier(item.course);
      setOpen(false);
      router.push(`/editor/course/${courseIdentifier}`);
      return;
    }

    if (item.kind === "story" && item.course && item.story) {
      const courseIdentifier = getCourseIdentifier(item.course);
      setOpen(false);
      router.push(`/editor/course/${courseIdentifier}/story/${item.story.id}`);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((currentIndex) =>
        items.length === 0 ? 0 : Math.min(currentIndex + 1, items.length - 1),
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const activeItem = items[activeIndex];
      if (activeItem) onSelectItem(activeItem);
      return;
    }

    if (event.key === "Backspace" && selectedCourse && query.trim() === "") {
      event.preventDefault();
      setSelectedCourseKey(null);
      setActiveIndex(0);
      return;
    }

    if (event.key === "ArrowLeft" && selectedCourse && query.trim() === "") {
      event.preventDefault();
      setSelectedCourseKey(null);
      setActiveIndex(0);
    }
  }

  const isLoadingStories =
    Boolean(selectedCourse) && storyResults === undefined;
  const emptyState = selectedCourse
    ? trimmedQuery
      ? "No stories match this search."
      : "No stories in this course yet."
    : trimmedQuery
      ? "No courses match this search."
      : "No courses available.";

  return (
    <>
      {showTrigger ? (
        <button
          type="button"
          className="inline-flex h-11 min-w-0 items-center gap-3 rounded-[16px] border border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_80%,white_20%)] px-3 text-[var(--text-color-dim)] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--body-background)_55%,white_45%)] hover:text-[var(--text-color)]"
          onClick={() =>
            openPaletteInstant(
              currentCourse,
              setOpen,
              setQuery,
              setSelectedCourseKey,
              setActiveIndex,
            )
          }
          aria-label="Open navigation palette"
        >
          <SearchIcon className="size-4 shrink-0" />
          <span className="hidden min-[780px]:inline">Go to…</span>
          <KbdGroup>
            <Kbd className="min-w-7 px-2">{shortcutLabel}</Kbd>
            <Kbd className="px-2">K</Kbd>
          </KbdGroup>
        </button>
      ) : null}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          forceMount
          disableAnimation
          className="overflow-hidden border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_92%,white_8%)] p-0 sm:max-w-[760px]"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">
            Editor navigation palette
          </DialogTitle>
          <DialogDescription className="sr-only">
            Quickly jump between editor courses and stories.
          </DialogDescription>
          <div className="border-b border-[var(--header-border)] bg-[color:color-mix(in_srgb,var(--body-background)_88%,white_12%)] px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-[13px] text-[var(--text-color-dim)]">
                {selectedCourse ? (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color-dim)] transition-colors hover:text-[var(--text-color)]"
                    onClick={() => {
                      setSelectedCourseKey(null);
                      setActiveIndex(0);
                    }}
                    aria-label="Browse courses"
                  >
                    <ArrowLeftIcon className="size-4" />
                  </button>
                ) : (
                  <span className="rounded-full border border-[var(--header-border)] bg-[var(--body-background)] px-3 py-1 font-medium">
                    Courses
                  </span>
                )}
                <span className="truncate">
                  {selectedCourse
                    ? `${selectedCourse.learning_language_name} stories`
                    : "Jump between language courses"}
                </span>
              </div>
              <button
                type="button"
                className="transition-colors hover:text-[var(--text-color)]"
                onClick={() => onOpenChange(false)}
              >
                <Kbd className="min-w-8 px-2">Esc</Kbd>
              </button>
            </div>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--text-color-dim)]" />
              <Input
                ref={inputRef}
                type="search"
                value={query}
                placeholder={
                  selectedCourse
                    ? "Search stories by set or title"
                    : "Search courses by language"
                }
                aria-label={
                  selectedCourse ? "Search stories" : "Search courses"
                }
                autoComplete="off"
                className="pr-20 pl-10"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
              />
              <div className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1 text-[11px] uppercase tracking-[0.08em] text-[var(--text-color-dim)]">
                <Kbd className="h-7 gap-1 px-2 normal-case">
                  <CornerDownLeftIcon className="size-3.5" />
                  <span className="uppercase tracking-[0.08em]">Open</span>
                </Kbd>
              </div>
            </div>
          </div>
          <div
            ref={scrollViewportRef}
            className="h-[min(62vh,560px)] overflow-y-auto px-2 py-2"
          >
            {isLoadingStories ? (
              <div className="flex min-h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-12 text-center text-[var(--text-color-dim)]">
                {emptyState}
              </div>
            ) : (
              <div
                className="relative w-full"
                style={{ height: `${listVirtualizer.getTotalSize()}px` }}
              >
                {listVirtualizer.getVirtualItems().map((virtualItem) => {
                  const item = items[virtualItem.index];
                  const isActive = virtualItem.index === activeIndex;

                  return (
                    <div
                      key={item.id}
                      ref={listVirtualizer.measureElement}
                      data-index={virtualItem.index}
                      className="absolute top-0 left-0 w-full pb-1"
                      style={{
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                    >
                      <PaletteListItem
                        item={item}
                        index={virtualItem.index}
                        isActive={isActive}
                        setActiveIndex={setActiveIndex}
                        onSelectItem={onSelectItem}
                        itemRefs={itemRefs}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function openPaletteInstant(
  currentCourse: CourseProps | null,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>,
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  setSelectedCourseKey: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
) {
  setOpen(true);
  startTransition(() => {
    setQuery("");
    setSelectedCourseKey(currentCourse ? getCourseKey(currentCourse) : null);
    setActiveIndex(0);
  });
}

function resetPaletteState(
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  setSelectedCourseKey: React.Dispatch<React.SetStateAction<string | null>>,
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>,
) {
  startTransition(() => {
    setQuery("");
    setSelectedCourseKey(null);
    setActiveIndex(0);
  });
}

function getCourseIdentifier(course: CourseProps) {
  return course.short ?? String(course.id);
}

function getCourseKey(course: CourseProps) {
  return `${course.short ?? course.id}`;
}

function matchesCourseSearch(course: CourseProps, normalizedQuery: string) {
  if (!normalizedQuery) return true;

  const fields = [
    course.learning_language_name,
    course.from_language_name,
    course.from_language_short,
    course.learning_language_short,
    course.short ?? "",
    String(course.id),
  ];

  for (const field of fields) {
    if (field.toLocaleLowerCase().includes(normalizedQuery)) {
      return true;
    }
  }

  return false;
}

function PaletteListItem({
  item,
  index,
  isActive,
  setActiveIndex,
  onSelectItem,
  itemRefs,
}: {
  item: PaletteItem;
  index: number;
  isActive: boolean;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  onSelectItem: (item: PaletteItem) => void;
  itemRefs: React.RefObject<Array<HTMLButtonElement | null>>;
}) {
  return (
    <button
      ref={(element) => {
        itemRefs.current[index] = element;
      }}
      type="button"
      className={cn(
        "flex min-h-[72px] w-full items-center gap-3 rounded-[18px] px-3 py-3 text-left transition-colors",
        isActive
          ? "bg-[var(--button-background)] text-[var(--button-color)]"
          : "text-[var(--text-color)] hover:bg-[var(--body-background-faint)]",
      )}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => onSelectItem(item)}
    >
      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center">
        {item.story ? (
          <img
            alt={`${item.label} story icon`}
            src={`https://stories-cdn.duolingo.com/image/${item.story.image}.svg`}
            width="42"
            height="38"
            className="block h-[38px] w-[42px]"
          />
        ) : item.course ? (
          <LanguageFlag
            languageId={item.course.learningLanguageId}
            width={42}
          />
        ) : (
          <div
            className={cn(
              "flex h-[42px] w-[42px] items-center justify-center rounded-[12px] border text-[12px] font-semibold",
              isActive
                ? "border-white/30 bg-white/15 text-[var(--button-color)]"
                : "border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color-dim)]",
            )}
          >
            {item.story ? formatStorySetLabel(item.story) : "Go"}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-semibold">{item.label}</div>
        <div
          className={cn(
            "truncate text-[13px]",
            isActive
              ? "text-[color:rgba(255,255,255,0.82)]"
              : "text-[var(--text-color-dim)]",
          )}
        >
          {item.subtitle}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {item.meta ? (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.08em]",
              isActive
                ? "bg-white/15 text-[var(--button-color)]"
                : "bg-[var(--body-background)] text-[var(--text-color-dim)]",
            )}
          >
            {item.meta}
          </span>
        ) : null}
        <ChevronRightIcon
          className={cn(
            "size-4",
            isActive
              ? "text-[var(--button-color)]"
              : "text-[var(--text-color-dim)]",
          )}
        />
      </div>
    </button>
  );
}
