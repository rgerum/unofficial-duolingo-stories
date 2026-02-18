"use client";

import React from "react";
import LanguageButton, {
  type LandingCourseButtonData,
} from "./language_button";
import { api } from "@convex/_generated/api";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import type { Id } from "@convex/_generated/dataModel";

interface LandingGroupData {
  fromLanguageId: Id<"languages">;
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
  return <RenderCourseGroups groups={landingData.groups} />;
}
