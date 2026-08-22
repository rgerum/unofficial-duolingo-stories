"use client";

import { useSelectedLayoutSegments } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { isCourseStoryListRoute } from "./route_loading_state";
import StoryListLoading from "./story_list_loading";

/*
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

 */

export default function Loading() {
  const segments = useSelectedLayoutSegments();

  if (isCourseStoryListRoute(segments)) {
    return (
      <>
        <div className="min-[976px]:hidden">
          <StoryListLoading />
        </div>
        <div className="hidden min-[976px]:block">
          <GenericLoading />
        </div>
      </>
    );
  }

  return <GenericLoading />;
}

function GenericLoading() {
  return (
    <div className="flex min-h-[calc(100vh-300px)] flex-col">
      <div className="mb-[-75px] text-center text-[30px]">Loading</div>
      <Spinner />
    </div>
  );
}
