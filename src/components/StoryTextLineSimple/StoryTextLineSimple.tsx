import React from "react";
import { cn } from "@/lib/utils";

function StoryTextLineSimple({
  speaker,
  highlight,
  id,
  children,
}: {
  speaker: string;
  highlight: boolean;
  id: string;
  children: React.ReactNode;
}) {
  const className = cn(
    "my-4 flex items-baseline gap-4",
    highlight &&
      "bg-[#e6f484] [-webkit-print-color-adjust:exact] [print-color-adjust:exact]",
  );

  return (
    <div className={className}>
      <span className="inline-block w-[100px] shrink-0 text-right font-bold">
        {speaker}:
      </span>
      <span className="flex-1"> {children}</span>
      <span className="text-right font-mono font-bold">{id}</span>
    </div>
  );
}

export default StoryTextLineSimple;
