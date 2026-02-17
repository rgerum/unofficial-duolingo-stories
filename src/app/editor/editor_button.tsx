import React from "react";
import Link from "next/link";

export default function EditorButton({
  style,
  onClick,
  id,
  alt,
  img,
  text,
  href,
  checked,
}: {
  style?: React.CSSProperties;
  onClick?: () => void;
  id?: string;
  alt?: string;
  img?: string;
  text?: string;
  href?: string;
  checked?: boolean;
}) {
  const baseClassName =
    "flex cursor-pointer items-center text-[var(--text-color-dim)] no-underline transition-all hover:text-[var(--text-color)] hover:brightness-[0.7] hover:contrast-[2.5] max-[800px]:px-[10px] max-[800px]:py-[14px] max-[1120px]:w-auto max-[1120px]:flex-col px-[34px] py-[14px]";
  const iconWrapClassName =
    "flex items-center max-[1120px]:h-8 max-[1120px]:p-0";
  const iconClassName = "w-9 max-[1120px]:mr-0";
  const textClassName =
    "pl-[10px] no-underline max-[1120px]:mt-[-5px] max-[1120px]:p-0";

  if (checked !== undefined) {
    if (onClick === undefined) throw new Error();
    return (
      <div
        className={baseClassName}
        onClick={(e) => {
          e.preventDefault();
          onClick();
        }}
      >
        <label className="relative my-[9px] inline-block h-[17px] w-[30px]">
          <input type="checkbox" checked={checked} readOnly className="peer sr-only" />
          <span className="absolute inset-0 cursor-pointer rounded-[17px] bg-[var(--overview-hr)] transition-all peer-checked:bg-[var(--button-background)] peer-focus:shadow-[0_0_1px_var(--button-border)]" />
          <span className="pointer-events-none absolute bottom-[2px] left-[2px] h-[13px] w-[13px] rounded-full bg-[var(--body-background)] transition-transform peer-checked:translate-x-[13px]" />
        </label>
        <span className={textClassName}>{text}</span>
      </div>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        style={style}
        id={id}
        className={baseClassName}
        onClick={onClick}
      >
        <div className={iconWrapClassName}>
          <img className={iconClassName} alt={alt} src={`/editor/icons/${img}`} />
        </div>
        <span className={textClassName}>{text}</span>
      </Link>
    );
  }
  return (
    <div
      style={style}
      id={id}
      className={baseClassName}
      onClick={onClick}
    >
      <div className={iconWrapClassName}>
        <img className={iconClassName} alt={alt} src={`/editor/icons/${img}`} />
      </div>
      <span className={textClassName}>{text}</span>
    </div>
  );
}
