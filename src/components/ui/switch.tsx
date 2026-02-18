export default function Switch({
  checked,
  onClick,
}: {
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onClick}
      className={[
        "relative inline-flex h-[32px] w-[56px] items-center rounded-full border border-transparent transition-colors",
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
