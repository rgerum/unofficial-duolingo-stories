import React, { CSSProperties } from "react";

function ProgressBar({
  progress,
  length,
}: {
  progress: number;
  length: number;
}) {
  return (
    <div
      className="h-4 w-full overflow-hidden rounded-full bg-[var(--progress-back)]"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={length}
    >
      <div
        className="relative h-4 w-[var(--width)] rounded-full bg-[var(--progress-inside)] transition-[width] duration-200"
        style={{ "--width": (progress / length) * 100 + "%" } as CSSProperties}
      >
        <div className="absolute top-1/4 right-2 left-2 h-[30%] rounded-[inherit] bg-[var(--progress-highlight)] opacity-20" />
      </div>
    </div>
  );
}

export default ProgressBar;
