import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  children: React.ReactNode;
  primary?: boolean;
  variant?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    primary = false,
    variant: _variant,
    className,
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = Boolean(disabled);

  return (
    <button
      ref={ref}
      className={cn(
        "mt-1 rounded-[15px] p-0 transition-[filter,transform] duration-100",
        primary
          ? "bg-[var(--button-blue-border)] text-[var(--button-blue-color)]"
          : "bg-[var(--button-border)] text-[var(--button-color)]",
        isDisabled &&
          "cursor-not-allowed bg-[var(--button-inactive-background)] text-[var(--button-inactive-color)]",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      <span
        className={cn(
          "block rounded-[inherit] px-[30px] py-[10px] text-[1rem] font-bold uppercase transition-transform duration-100",
          isDisabled
            ? "bg-[var(--button-inactive-background)] translate-y-0"
            : primary
              ? "bg-[var(--button-blue-background)] -translate-y-1 hover:-translate-y-[5px] active:-translate-y-0.5"
              : "bg-[var(--button-background)] -translate-y-1 hover:-translate-y-[5px] active:-translate-y-0.5",
        )}
      >
        {children}
      </span>
    </button>
  );
});
