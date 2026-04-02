"use client";
import React from "react";
import Link from "next/link";
import styles from "./StoryHeaderProgress.module.css";
import ProgressBar from "../ProgressBar";
import VisuallyHidden from "../VisuallyHidden";

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
    <div className={styles.header}>
      <Link className={styles.header_close} data-cy="quit" href={courseHref}>
        <VisuallyHidden>Back to Course Page</VisuallyHidden>
      </Link>
      {progress !== undefined && length !== undefined && (
        <ProgressBar progress={progress} length={length} />
      )}
    </div>
  );
}

export default StoryHeaderProgress;
