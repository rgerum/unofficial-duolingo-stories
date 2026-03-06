import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = {
  label?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

const inputClassName =
  "w-full rounded-[16px] border-2 border-[var(--input-border)] bg-[var(--input-background)] px-[17px] py-[10px] text-[calc(16/16*1rem)] text-[var(--text-color)] outline-none transition focus:border-[color:color-mix(in_srgb,var(--link-blue)_45%,var(--input-border))] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--link-blue)_12%,transparent)]";

export default React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label = "", className, ...props },
  ref,
) {
  const input = (
    <input ref={ref} className={cn(inputClassName, className)} {...props} />
  );

  if (!label) return input;

  return (
    <label className="inline-flex items-baseline gap-2">
      <span>{label}</span>
      {input}
    </label>
  );
});
