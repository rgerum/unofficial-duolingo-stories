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
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className={[
        "relative inline-flex h-[32px] w-[56px] items-center rounded-full border border-transparent transition-colors",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        checked
          ? "bg-[var(--button-background)]"
          : "bg-[var(--button-inactive-background)]",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-[26px] w-[26px] transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[26px]" : "translate-x-[3px]",
        ].join(" ")}
      />
    </button>
  );
}
