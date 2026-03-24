import * as React from "react";
import { cn } from "@/lib/utils";

export default function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "rounded-[10px] bg-[var(--editor-ssml)] px-[10px] py-[5px]",
        className,
      )}
      {...props}
    />
  );
}
