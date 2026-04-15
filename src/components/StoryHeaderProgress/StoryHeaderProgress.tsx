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
  editHref?: string;
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 20L8.5 18.9L18.4 9C19.2 8.2 19.2 6.9 18.4 6.1L17.9 5.6C17.1 4.8 15.8 4.8 15 5.6L5.1 15.5L4 20Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 7L17 10.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StoryHeaderProgress({
  course,
  setId,
  progress,
  length,
  editHref,
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
      {editHref ? (
        <Link
          href={editHref}
          className="ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--header-border)] bg-[var(--body-background)] text-[var(--text-color-dim)] transition-colors duration-100 hover:border-[color:color-mix(in_srgb,var(--link-blue)_22%,var(--header-border))] hover:bg-[color:color-mix(in_srgb,var(--overview-hr)_35%,var(--body-background))] hover:text-[var(--text-color)] active:bg-[color:color-mix(in_srgb,var(--overview-hr)_55%,var(--body-background))] max-[500px]:h-10 max-[500px]:w-10"
        >
          <PencilIcon />
          <VisuallyHidden>Edit story</VisuallyHidden>
        </Link>
      ) : null}
    </div>
  );
}

export default StoryHeaderProgress;
