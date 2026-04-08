import React from "react";
import { cn } from "@/lib/utils";

function PlayAudio({
  onClick,
  rtl = false,
}: {
  onClick?: () => void;
  rtl?: boolean;
}) {
  if (onClick === undefined) return null;
  return (
    <img
      onClick={onClick}
      src="https://d35aaqx5ub95lt.cloudfront.net/images/d636e9502812dfbb94a84e9dfa4e642d.svg"
      className={cn(
        "relative top-[2px] mr-2 inline-block h-[23px] w-7 shrink-0 cursor-pointer align-text-bottom",
        rtl && "mr-0 ml-2 scale-x-[-1]",
      )}
      alt="speaker"
    />
  );
}

export default PlayAudio;
