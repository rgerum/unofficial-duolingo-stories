import React from "react";
import Input from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(function EditorSearchInput({ className, style, ...props }, ref) {
  return (
    <Input
      ref={ref}
      className={cn(
        "max-[975px]:h-12 max-[975px]:text-[16px] max-[975px]:leading-6",
        className,
      )}
      style={{ WebkitTextSizeAdjust: "100%", ...style }}
      {...props}
    />
  );
});
