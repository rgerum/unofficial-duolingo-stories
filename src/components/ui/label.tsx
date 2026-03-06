import * as React from "react";
import { cn } from "@/lib/utils";

export default function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("inline-flex flex-row items-baseline gap-2", className)}
      {...props}
    />
  );
}
