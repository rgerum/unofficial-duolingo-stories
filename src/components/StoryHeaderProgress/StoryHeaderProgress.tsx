import React from "react";
import Link from "next/link";
import styles from "./StoryHeaderProgress.module.css";
import ProgressBar from "../ProgressBar";
import VisuallyHidden from "../VisuallyHidden";

interface StoryHeaderProgressProps {
  course: string;
  progress?: number;
  length?: number;
}

function StoryHeaderProgress({
  course,
  progress,
  length,
}: StoryHeaderProgressProps) {
  return (
    <div className={styles.header}>
      <Link className={styles.header_close} data-cy="quit" href={`/${course}`}>
        <VisuallyHidden>Back to Course Page</VisuallyHidden>
      </Link>
      {progress !== undefined && length !== undefined && (
        <ProgressBar progress={progress} length={length} />
      )}
    </div>
  );
}

export default StoryHeaderProgress;
