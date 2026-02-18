import React from "react";

export default function Button({
  children,
  disabled,
  primary = false,
  variant: _variant,
  ...delegated
}: {
  children: React.ReactNode;
  disabled?: boolean;
  primary?: boolean;
  variant?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClass =
    "group mt-1 rounded-[15px] border-0 p-0 text-[var(--button-color)] transition-[box-shadow,transform,background-color] duration-100 bg-[var(--button-border)]";
  const primaryClass = primary
    ? " bg-[var(--button-blue-border)] text-[var(--button-blue-color)]"
    : "";
  const wrapperClass =
    "block rounded-[inherit] px-[30px] py-[10px] text-[1rem] font-bold uppercase transition-transform duration-500 ease-out group-hover:brightness-110 group-hover:duration-100 group-hover:[transform:translateY(-5px)] group-active:duration-75 group-active:ease-out group-active:[transform:translateY(-2px)] [transform:translateY(-4px)]";
  const wrapperToneClass = primary
    ? " bg-[var(--button-blue-background)]"
    : " bg-[var(--button-background)]";

  if (disabled) {
    return (
      <button
        className={`${baseClass} bg-[var(--button-inactive-background)] text-[var(--button-inactive-color)]`}
        disabled
        {...delegated}
      >
        <span className="block rounded-[inherit] bg-[var(--button-inactive-background)] px-[30px] py-[10px] text-[1rem] font-bold uppercase">
          {children}
        </span>
      </button>
    );
  }

  return (
    <button className={`${baseClass}${primaryClass}`} {...delegated}>
      <span className={`${wrapperClass}${wrapperToneClass}`}>{children}</span>
    </button>
  );
}
