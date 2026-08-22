"use client";

export default function MobileEditorSectionSwitch<Section extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: readonly { value: Section; label: string }[];
  selected: Section;
  onSelect: (section: Section) => void;
}) {
  return (
    <div
      className="sticky top-0 z-10 grid grid-cols-2 border-b border-[var(--header-border)] bg-[var(--body-background)] p-2 min-[976px]:hidden"
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            className={`min-h-11 rounded-xl !text-base font-bold ${
              isSelected
                ? "bg-[var(--button-background)] text-[var(--button-color)]"
                : "text-[var(--text-color-dim)]"
            }`}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
