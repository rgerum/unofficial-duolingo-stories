"use client";

import { api } from "@convex/_generated/api";
import { Preloaded, usePreloadedQuery, useQuery } from "convex/react";

function LandingStatsText({
  stats,
}: {
  stats:
    | {
        courseCount: number;
        storyCount: number;
      }
    | undefined;
}) {
  if (!stats) {
    return <>... stories in ... courses and counting!</>;
  }

  return (
    <>
      {stats.storyCount} stories in {stats.courseCount} courses and counting!
    </>
  );
}

function LandingStatsClientPreloaded({
  preloadedLandingData,
}: {
  preloadedLandingData: Preloaded<typeof api.landing.getPublicLandingPageData>;
}) {
  const landingData = usePreloadedQuery(preloadedLandingData);
  return <LandingStatsText stats={landingData?.stats} />;
}

function LandingStatsClientQuery() {
  const landingData = useQuery(api.landing.getPublicLandingPageData, {});
  return <LandingStatsText stats={landingData?.stats} />;
}

export default function LandingStatsClient({
  preloadedLandingData,
}: {
  preloadedLandingData?: Preloaded<typeof api.landing.getPublicLandingPageData>;
}) {
  if (preloadedLandingData) {
    return (
      <LandingStatsClientPreloaded preloadedLandingData={preloadedLandingData} />
    );
  }
  return <LandingStatsClientQuery />;
}
