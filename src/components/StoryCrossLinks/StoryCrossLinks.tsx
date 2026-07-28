"use client";
import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { StoryCrossLinksData } from "@/app/(stories)/story/[story_id]/getStoryCrossLinks";
import { cn } from "@/lib/utils";
import { useLocalisation } from "../LocalisationProvider/LocalisationProviderContext";

type NeighbourStory = StoryCrossLinksData["previous"];

/**
 * Quiet block of internal links to the neighbouring stories of the same
 * course. It doubles as a "continue with the next story" shortcut and as the
 * crawl path that keeps story pages from being orphaned behind a single link
 * from their course page.
 */
export default function StoryCrossLinks({
  crossLinks,
  rtl,
  className,
}: {
  crossLinks: StoryCrossLinksData | null;
  rtl?: boolean;
  className?: string;
}) {
  const localisation = useLocalisation();
  const headingId = React.useId();

  if (!crossLinks) return null;
  const { course, previous, next, more } = crossLinks;
  if (!previous && !next && more.length === 0) return null;

  const language = course.learning_language_name || course.name;
  const heading =
    localisation("story_more_stories", { $language: language }) ??
    `More ${language} stories`;
  const allStories =
    localisation("story_all_stories", { $language: language }) ??
    `All ${language} stories`;
  const previousLabel =
    localisation("story_previous_story") ?? "Previous story";
  const nextLabel = localisation("story_next_story") ?? "Next story";

  return (
    <nav
      aria-labelledby={headingId}
      className={cn(
        "pointer-events-auto mt-8 w-full max-w-[500px] rounded-2xl border-2 border-[var(--color_base_border)] bg-[var(--color_base_background)] px-4 py-3 text-left",
        rtl && "[direction:rtl] text-right",
        className,
      )}
    >
      <h2
        id={headingId}
        className="m-0 text-xs font-bold tracking-[0.12em] uppercase text-[var(--text-color-dim)]"
      >
        {heading}
      </h2>

      {previous || next ? (
        <div className="mt-2 grid gap-2 min-[420px]:grid-cols-2">
          <NeighbourLink
            story={previous}
            label={previousLabel}
            direction="previous"
            rtl={rtl}
          />
          <NeighbourLink
            story={next}
            label={nextLabel}
            direction="next"
            rtl={rtl}
          />
        </div>
      ) : null}

      {more.length > 0 ? (
        <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
          {more.map((story) => (
            <li key={story.id} className="m-0">
              <Link
                href={`/story/${story.id}`}
                className="block truncate text-[15px] leading-[24px] text-[var(--text-color)] no-underline hover:text-[var(--link-hover)] hover:underline"
              >
                {story.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href={`/${course.short}`}
        className="mt-3 inline-block text-[13px] font-bold text-[var(--text-color-dim)] no-underline hover:text-[var(--link-hover)] hover:underline"
      >
        {allStories}
      </Link>
    </nav>
  );
}

function NeighbourLink({
  story,
  label,
  direction,
  rtl,
}: {
  story: NeighbourStory;
  label: React.ReactNode;
  direction: "previous" | "next";
  rtl?: boolean;
}) {
  // In an RTL block "previous" points to the right, so the chevron follows the
  // reading direction rather than the physical side.
  const pointsLeft = rtl ? direction === "next" : direction === "previous";
  const Chevron = pointsLeft ? ChevronLeft : ChevronRight;

  if (!story) {
    // Keeps the next-story card in its column when there is no previous story.
    return <span className="hidden min-[420px]:block" aria-hidden="true" />;
  }

  return (
    <Link
      href={`/story/${story.id}`}
      className={cn(
        "flex items-center gap-1 rounded-xl px-2 py-1.5 no-underline hover:bg-[var(--body-background-faint)]",
        direction === "next" &&
          "min-[420px]:justify-end min-[420px]:text-right",
        direction === "next" && rtl && "min-[420px]:text-left",
      )}
    >
      {pointsLeft ? (
        <Chevron
          className="size-4 shrink-0 text-[var(--text-color-dim)]"
          aria-hidden="true"
        />
      ) : null}
      <span className="min-w-0">
        <span className="block text-[11px] leading-[16px] font-bold tracking-[0.08em] uppercase text-[var(--text-color-dim)]">
          {label}
        </span>
        <span className="block truncate text-[15px] leading-[22px] text-[var(--text-color)]">
          {story.name}
        </span>
      </span>
      {pointsLeft ? null : (
        <Chevron
          className="size-4 shrink-0 text-[var(--text-color-dim)]"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}
