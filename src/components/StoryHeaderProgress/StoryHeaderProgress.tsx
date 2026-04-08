"use client";
import React from "react";
import Link from "next/link";
import ProgressBar from "../ProgressBar";
import VisuallyHidden from "../VisuallyHidden";

const closeIconStyle = {
  backgroundImage:
    "url(//d35aaqx5ub95lt.cloudfront.net/images/icon-sprite8.svg)",
  backgroundPosition: "-373px -154px",
};

interface StoryHeaderProgressProps {
  course: string;
  setId?: number;
  progress?: number;
  length?: number;
}

function StoryHeaderProgress({
  course,
  setId,
  progress,
  length,
}: StoryHeaderProgressProps) {
  const courseHref = (setId ?? 0) > 0 ? `/${course}#${setId}` : `/${course}`;

  return (
    <div className="sticky top-0 z-[1] mx-auto flex max-w-[1000px] items-center gap-4 bg-[var(--body-background)] px-10 py-10 max-[500px]:px-5 max-[500px]:py-[17px]">
      <Link
        className="inline-block h-[18px] w-[18px] shrink-0 align-middle bg-no-repeat"
        data-cy="quit"
        href={courseHref}
        style={closeIconStyle}
      >
        <VisuallyHidden>Back to Course Page</VisuallyHidden>
      </Link>
      {progress !== undefined && length !== undefined && (
        <ProgressBar progress={progress} length={length} />
      )}
    </div>
  );
}

export default StoryHeaderProgress;
