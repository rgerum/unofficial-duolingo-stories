"use client";

import {
  Switch as SwitchPart,
  SwitchThumb as SwitchThumbPart,
} from "@ui-sdk/react/switch";

const trackClassName =
  "relative inline-flex h-[32px] w-[56px] shrink-0 items-center rounded-full border border-transparent transition-colors";
const thumbClassName =
  "inline-block h-[26px] w-[26px] transform rounded-full bg-white shadow transition-transform";

export default function Switch({
  checked,
  onClick,
  disabled = false,
  ariaLabel,
}: {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <SwitchPart
      checked={checked}
      onCheckedChange={() => onClick()}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        trackClassName,
        "bg-[var(--button-inactive-background)] data-checked:bg-[var(--button-background)]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <SwitchThumbPart
        className={`${thumbClassName} translate-x-[3px] data-checked:translate-x-[26px]`}
      />
    </SwitchPart>
  );
}

/**
 * The switch's look without its behavior, for rows where a surrounding button
 * already toggles the setting.
 */
export function SwitchVisual({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={[
        trackClassName,
        checked
          ? "bg-[var(--button-background)]"
          : "bg-[var(--button-inactive-background)]",
      ].join(" ")}
    >
      <span
        className={[
          thumbClassName,
          checked ? "translate-x-[26px]" : "translate-x-[3px]",
        ].join(" ")}
      />
    </span>
  );
}
