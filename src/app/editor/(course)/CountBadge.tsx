"use client";

type CountBadgeProps = {
  count: number | undefined;
  icon: string;
  title: string;
  label: string;
  className: string;
  compact?: boolean;
};

export function CountBadge({
  count,
  icon,
  title,
  label,
  className,
  compact = false,
}: CountBadgeProps) {
  if (!count) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full leading-none font-bold ${compact ? "px-1.5 py-1 text-xs" : "px-[8px] py-[5px] text-[14px]"} ${className}`}
      role="img"
      title={title}
      aria-label={label}
    >
      <span aria-hidden="true">
        {icon} {count}
      </span>
    </span>
  );
}
