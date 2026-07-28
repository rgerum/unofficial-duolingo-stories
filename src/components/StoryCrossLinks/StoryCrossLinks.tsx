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

  if (!crossLinks) return null;
  const { course, previous, next } = crossLinks;
  if (!previous && !next) return null;

  const language = course.learning_language_name || course.name;
  const previousLabel =
    localisation("story_previous_story") ?? "Previous story";
  const nextLabel = localisation("story_next_story") ?? "Next story";

  return (
    <nav
      aria-label={`${language} stories`}
      className={cn(
        "pointer-events-auto mt-8 w-full max-w-[500px] rounded-2xl border-2 border-[var(--color_base_border)] bg-[var(--color_base_background)] px-3 py-2 text-left",
        rtl && "[direction:rtl] text-right",
        className,
      )}
    >
      <div className="grid gap-2 min-[420px]:grid-cols-2">
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
