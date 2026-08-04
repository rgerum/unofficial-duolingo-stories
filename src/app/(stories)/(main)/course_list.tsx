"use client";

import React, { useState } from "react";
import LanguageButton, {
  type LandingCourseButtonData,
} from "./language_button";
import { api } from "@convex/_generated/api";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";
import Input from "@/components/ui/input";
import { Search } from "lucide-react";
import { filterCourseGroups } from "./course_filter";

interface LandingGroupData {
  fromLanguageId: Id<"languages">;
  fromLanguageName: string;
  labels: {
    storiesFor: string;
    nStoriesTemplate: string;
  };
  courses: LandingCourseButtonData[];
}

function RenderCourseGroups({ groups }: { groups: LandingGroupData[] }) {
  let startIndex = 0;
  return (
    <>
      {groups.map((group) => {
        const currentStart = startIndex;
        startIndex += group.courses.length;
        return (
          <div key={group.fromLanguageId} className="flex flex-col">
            <hr className="my-0 mt-[30px] mb-[22px] h-0 w-full border-0 border-t-2 border-[var(--overview-hr)]" />
            <div className="mb-[14px] w-full pl-[5px] text-[calc(24/16*1rem)] font-bold">
              {group.labels.storiesFor}
            </div>
            <ol className="grid w-full list-none grid-cols-[repeat(auto-fill,minmax(min(190px,calc(50%-12px)),1fr))] gap-3 p-0">
              {group.courses.map((course, index) => (
                <li key={course.id}>
                  <LanguageButton
                    course={course}
                    storiesTemplate={group.labels.nStoriesTemplate}
                    eagerFlagImage={currentStart + index < 8}
                  />
                </li>
              ))}
            </ol>
          </div>
        );
      })}
    </>
  );
}

export default function CourseList({
  preloadedLandingData,
}: {
  preloadedLandingData: Preloaded<typeof api.landing.getPublicLandingPageData>;
}) {
  const landingData = usePreloadedQuery(preloadedLandingData);
  const [query, setQuery] = useState("");
  const filteredGroups = filterCourseGroups(landingData.groups, query);

  return (
    <section aria-label="Courses" className="pb-6">
      <div className="relative mx-auto mt-7 w-full max-w-xl">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-[var(--text-color-dim)] opacity-60"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses"
          aria-label="Search courses"
          autoComplete="off"
          className="pl-12 text-[calc(18/16*1rem)]"
        />
      </div>
      {filteredGroups.length > 0 ? (
        <RenderCourseGroups groups={filteredGroups} />
      ) : (
        <p className="py-16 text-center text-[calc(18/16*1rem)] text-[var(--text-color-dim)]">
          No courses found for &ldquo;{query.trim()}&rdquo;.
        </p>
      )}
    </section>
  );
}
