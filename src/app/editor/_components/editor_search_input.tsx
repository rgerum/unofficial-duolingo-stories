import React from "react";
import Input from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const editorSearchInputClassName =
  "max-[975px]:h-12 max-[975px]:text-[16px]! max-[975px]:leading-6 max-[975px]:placeholder:text-[16px] max-[975px]:placeholder:leading-6";

export default function EditorSearchInput({
  className,
  style,
  ref,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      ref={ref}
      className={cn(editorSearchInputClassName, className)}
      style={{ WebkitTextSizeAdjust: "100%", ...style }}
      {...props}
    />
  );
}
