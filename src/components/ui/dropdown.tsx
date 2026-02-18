import React from "react";

export default function Dropdown({ children }: { children: React.ReactNode }) {
  const childArray = React.Children.toArray(children).filter((child) =>
    React.isValidElement(child),
  );
  const trigger = childArray[0] ?? null;
  const menu = childArray[1] ?? null;

  if (!menu) {
    return <div className="relative">{children}</div>;
  }

  return (
    <div className="group relative">
      {trigger}
      <div className="absolute bottom-[-8px] left-[calc(50%-12px)] z-[2] hidden h-[10px] w-[25px] overflow-hidden group-hover:block">
        <div className="absolute left-[2.5px] top-[2.5px] z-[2] h-[15px] w-[15px] rotate-45 rounded-[3px] border border-[var(--header-border)] bg-[var(--body-background)]"></div>
      </div>
      <div className="absolute left-[-32px] z-[1] mt-[7px] hidden w-[118px] overflow-y-auto rounded-[15px] border border-[var(--header-border)] bg-[var(--body-background)] text-[18px] font-bold text-[var(--text-color)] [text-transform:none] group-hover:block max-[1080px]:left-[-50px]">
        {menu}
      </div>
    </div>
  );
}
