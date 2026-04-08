import React from "react";
import { cn } from "@/lib/utils";

function WordButton({
  status,
  children,
  className,
  ...delegated
}: {
  status: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isOff = status === "off";
  const outerClassName = cn(
    "m-1 inline-block rounded-[14px] border-0 bg-[var(--color_base_border)] p-0 text-[19px] leading-[1.45] text-[var(--color_base_color)]",
    status === "off" &&
      "cursor-auto bg-[var(--color_base_border)] text-transparent",
    status === "selected" &&
      "bg-[var(--color_selected_border-color)] text-[var(--color_selected_color)]",
    status === "wrong" && "animate-[story-wordbutton-wrong_0.8s]",
    status === "right" &&
      "animate-[story-wordbutton-right-to-disabled_1.5s_linear_both]",
    status === "false" &&
      "animate-[story-wordbutton-false-to-disabled_1.5s_both]",
    status === "done" &&
      "bg-[var(--color_disabled_border-color)] text-[var(--color_disabled_color)]",
    status === "right-stay" &&
      "bg-[var(--color_right_border-color)] text-[var(--color_right_color)]",
    className,
  );
  const innerClassName = cn(
    "block translate-y-[-2px] rounded-[inherit] border-2 border-[var(--color_base_border)] bg-[var(--color_base_background)] px-[15px] py-2 transition-[transform,background-color,border-color] duration-500",
    status === "off" &&
      "border-[var(--color_base_border)] bg-[var(--color_base_border)]",
    status === "selected" &&
      "border-[var(--color_selected_border-color)] bg-[var(--color_selected_background)]",
    status === "wrong" && "animate-[story-wordbutton-wrong-inner_0.8s]",
    status === "right" &&
      "animate-[story-wordbutton-right-to-disabled-inner_1.5s_linear_both] translate-y-0",
    status === "false" &&
      "animate-[story-wordbutton-false-to-disabled-inner_1.5s_both] translate-y-0",
    status === "done" &&
      "border-[var(--color_disabled_border-color)] bg-[var(--color_disabled_background)]",
    status === "right-stay" &&
      "border-[var(--color_right_border-color)] bg-[var(--color_right_background)]",
  );

  return (
    <button
      {...delegated}
      disabled={isOff}
      className={outerClassName}
      data-status={status}
    >
      <span className={innerClassName}>{children}</span>
    </button>
  );
}

export default WordButton;
