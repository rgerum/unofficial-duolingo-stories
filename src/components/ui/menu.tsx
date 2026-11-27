"use client";

import * as React from "react";
import {
  Menu,
  MenuContent as MenuContentPart,
  MenuItem as MenuItemPart,
  MenuSeparator as MenuSeparatorPart,
  MenuTrigger,
} from "@ui-sdk/react/menu";

import { mergeClassName, popupTextReset } from "./ui-sdk";

function MenuContent({
  className,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenuContentPart>) {
  return (
    <MenuContentPart
      sideOffset={sideOffset}
      className={mergeClassName(
        `${popupTextReset} z-[1200] m-0 max-h-[var(--available-height)] min-w-[11rem] overflow-y-auto rounded-[15px] border border-[var(--header-border)] bg-[var(--body-background)] p-1 text-[var(--text-color)] shadow-[0_18px_38px_-22px_rgba(0,0,0,0.45)] outline-none transition-opacity duration-100 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none`,
        className,
      )}
      {...props}
    />
  );
}

function MenuItem({
  className,
  ...props
}: React.ComponentProps<typeof MenuItemPart>) {
  return (
    <MenuItemPart
      className={mergeClassName(
        "relative flex cursor-default select-none items-center rounded-[11px] px-3 py-2 text-[18px] font-bold outline-none transition-colors data-highlighted:bg-[var(--language-selector-hover-background)] data-highlighted:text-[var(--link-hover)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function MenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenuSeparatorPart>) {
  return (
    <MenuSeparatorPart
      className={mergeClassName(
        "-mx-1 my-1 h-px bg-[var(--header-border)]",
        className,
      )}
      {...props}
    />
  );
}

export { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger };
