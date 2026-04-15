import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant =
  | "default"
  | "primary"
  | "blue"
  | "destructive"
  | "secondary"
  | "outline"
  | "ghost"
  | "link";

export type ButtonSize = "default" | "sm" | "lg";

export type ButtonProps = {
  children: React.ReactNode;
  primary?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

function resolveVariant({
  primary = false,
  variant,
}: {
  primary?: boolean;
  variant?: ButtonVariant;
}) {
  return variant === "blue"
    ? "primary"
    : primary && variant === undefined
      ? "primary"
      : (variant ?? "default");
}

export function buttonRootClassName({
  className,
  disabled = false,
  primary = false,
  variant,
}: {
  className?: string;
  disabled?: boolean;
  primary?: boolean;
  variant?: ButtonVariant;
}) {
  const resolvedVariant = resolveVariant({ primary, variant });

  return cn(
    "mt-1 rounded-[15px] p-0 text-center font-bold uppercase transition-[background-color,border-color,box-shadow,filter,transform] duration-100 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[color:color-mix(in_srgb,var(--ring)_35%,transparent)]",
    {
      default:
        "bg-[var(--button-border)] text-[var(--button-color)] disabled:bg-[var(--button-inactive-background)] disabled:text-[var(--button-inactive-color)]",
      primary:
        "bg-[var(--button-blue-border)] text-[var(--button-blue-color)] disabled:bg-[var(--button-inactive-background)] disabled:text-[var(--button-inactive-color)]",
      destructive:
        "bg-[#ea8b8b] text-[#9b1c1c] disabled:bg-[var(--button-inactive-background)] disabled:text-[var(--button-inactive-color)]",
      secondary:
        "bg-[var(--overview-hr)] text-[var(--text-color)] hover:bg-[color:color-mix(in_srgb,var(--link-blue)_18%,var(--overview-hr))] hover:text-[var(--text-color)] disabled:bg-[var(--button-inactive-background)] disabled:text-[var(--button-inactive-color)]",
      outline:
        "bg-[var(--overview-hr)] text-[var(--text-color)] hover:bg-[color:color-mix(in_srgb,var(--link-blue)_18%,var(--overview-hr))] hover:text-[var(--text-color)] disabled:bg-[var(--button-inactive-background)] disabled:text-[var(--button-inactive-color)]",
      ghost:
        "bg-transparent text-[var(--text-color)] hover:bg-[color:color-mix(in_srgb,var(--body-background-faint)_88%,transparent)] disabled:text-[var(--button-inactive-color)]",
      link: "bg-transparent text-[var(--link-blue)] underline underline-offset-2 disabled:text-[var(--button-inactive-color)]",
    }[resolvedVariant],
    disabled &&
      "cursor-not-allowed bg-[var(--button-inactive-background)] text-[var(--button-inactive-color)]",
    className,
  );
}

export function buttonInnerClassName({
  disabled = false,
  primary = false,
  size = "default",
  variant,
}: {
  disabled?: boolean;
  primary?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
}) {
  const resolvedVariant = resolveVariant({ primary, variant });

  return cn(
    "block rounded-[inherit] text-[1rem] font-bold uppercase transition-[background-color,border-color,transform] duration-100",
    {
      default: disabled
        ? "bg-[var(--button-inactive-background)] text-[var(--button-inactive-color)]"
        : "bg-[var(--button-background)]",
      primary: disabled
        ? "bg-[var(--button-inactive-background)] text-[var(--button-inactive-color)]"
        : "bg-[var(--button-blue-background)]",
      destructive: disabled
        ? "bg-[var(--button-inactive-background)] text-[var(--button-inactive-color)]"
        : "bg-[#f7a3a3] text-[#9b1c1c] hover:bg-[#f39a9a]",
      secondary:
        "border-2 border-[var(--overview-hr)] bg-[var(--body-background)] text-[var(--text-color)] hover:border-[color:color-mix(in_srgb,var(--link-blue)_28%,var(--overview-hr))] hover:bg-[color:color-mix(in_srgb,var(--link-blue)_8%,var(--body-background))]",
      outline:
        "border-2 border-[var(--overview-hr)] bg-[var(--body-background)] text-[var(--text-color)] hover:border-[color:color-mix(in_srgb,var(--link-blue)_28%,var(--overview-hr))] hover:bg-[color:color-mix(in_srgb,var(--link-blue)_8%,var(--body-background))]",
      ghost:
        "bg-transparent text-[var(--text-color)] hover:bg-[color:color-mix(in_srgb,var(--body-background-faint)_88%,transparent)]",
      link: "bg-transparent px-0 py-0 text-[inherit] normal-case",
    }[resolvedVariant],
    {
      "px-[30px] py-[10px]": size === "default",
      "px-5 py-2 text-[0.92rem]": size === "sm",
      "px-9 py-[12px] text-[1.05rem]": size === "lg",
      "-translate-y-1 hover:-translate-y-[5px] active:-translate-y-0.5":
        !disabled && resolvedVariant !== "ghost" && resolvedVariant !== "link",
      "translate-y-0": disabled,
      "px-0 py-0": resolvedVariant === "link",
      "disabled:border-[var(--button-inactive-background)] disabled:bg-[var(--button-inactive-background)]":
        resolvedVariant === "secondary" ||
        resolvedVariant === "outline" ||
        resolvedVariant === "destructive",
      "text-[var(--button-inactive-color)]":
        disabled &&
        (resolvedVariant === "secondary" ||
          resolvedVariant === "outline" ||
          resolvedVariant === "destructive"),
    },
  );
}

export default React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    primary = false,
    variant,
    size = "default",
    className,
    disabled,
    ...props
  },
  ref,
) {
  const isDisabled = Boolean(disabled);
  const rootClassName = buttonRootClassName({
    className,
    disabled: isDisabled,
    primary,
    variant,
  });
  const innerClassName = buttonInnerClassName({
    disabled: isDisabled,
    primary,
    size,
    variant,
  });

  return (
    <button ref={ref} className={rootClassName} disabled={disabled} {...props}>
      <span className={innerClassName}>{children}</span>
    </button>
  );
});
