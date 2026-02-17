import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex appearance-none items-center justify-center gap-2 whitespace-nowrap rounded-2xl border-0 text-sm font-bold shadow-none transition-all disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-background)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--body-background)]",
  {
    variants: {
      variant: {
        default:
          "uppercase tracking-wide text-[var(--button-color)] [background:var(--button-background)] border-b-4 border-[var(--button-border)] hover:brightness-95 active:translate-y-px active:border-b-2",
        secondary:
          "border border-slate-300 bg-white text-slate-800 hover:border-[var(--button-background)] hover:bg-lime-50/60 hover:text-slate-900",
        destructive: "bg-rose-600 text-white hover:bg-rose-700",
        ghost: "text-slate-700 hover:bg-slate-100/80",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, ...props },
  ref,
) {
  return <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
});

export { Button, buttonVariants };
