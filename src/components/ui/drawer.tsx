"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent as DrawerContentPart,
  DrawerDescription as DrawerDescriptionPart,
  DrawerTitle as DrawerTitlePart,
} from "@ui-sdk/react/drawer";

import { cn } from "@/lib/utils";
import { mergeClassName, popupTextReset } from "./ui-sdk";

// The drawer slides and dims itself, so we only style its surface. Side
// drawers stretch to the viewport height through UI SDK's viewport element.

function DrawerContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Omit<React.ComponentProps<typeof DrawerContentPart>, "children"> & {
  children?: React.ReactNode;
  showCloseButton?: boolean;
}) {
  return (
    <>
      <DrawerBackdrop className="fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px]" />
      <DrawerContentPart
        className={mergeClassName(
          cn(
            popupTextReset,
            "relative flex flex-col gap-4 overflow-y-auto border-slate-200 bg-[var(--body-background)] text-[var(--text-color)] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.55)] outline-none",
            "data-[side=left]:h-full data-[side=left]:w-[min(22rem,calc(100vw-1.5rem))] data-[side=left]:border-r",
            "data-[side=right]:h-full data-[side=right]:w-[min(22rem,calc(100vw-1.5rem))] data-[side=right]:border-l",
            "data-[side=top]:w-full data-[side=top]:border-b",
            "data-[side=bottom]:w-full data-[side=bottom]:border-t",
          ),
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DrawerClose
            aria-label="Close"
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-[var(--button-background)] focus:ring-offset-2 focus:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon aria-hidden="true" />
          </DrawerClose>
        ) : null}
      </DrawerContentPart>
    </>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 p-4 pr-12", className)}
      {...props}
    />
  );
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerTitlePart>) {
  return (
    <DrawerTitlePart
      className={mergeClassName("m-0 text-base font-semibold", className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerDescriptionPart>) {
  return (
    <DrawerDescriptionPart
      className={mergeClassName("m-0 text-sm text-slate-500", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
};
