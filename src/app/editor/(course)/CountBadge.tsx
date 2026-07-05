"use client";

type CountBadgeProps = {
  count: number | undefined;
  icon: string;
  title: string;
  label: string;
  className: string;
};

export function CountBadge({
  count,
  icon,
  title,
  label,
  className,
}: CountBadgeProps) {
  if (!count) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-[8px] py-[5px] text-[14px] leading-none font-bold ${className}`}
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
