"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import {
  Dialog as DialogRoot,
  DialogBackdrop,
  DialogClose as DialogClosePart,
  DialogContent as DialogContentPart,
  DialogDescription as DialogDescriptionPart,
  DialogTitle as DialogTitlePart,
  DialogTrigger as DialogTriggerPart,
} from "@ui-sdk/react/dialog";

import { cn } from "@/lib/utils";
import { mergeClassName, popupTextReset } from "./ui-sdk";

// UI SDK renders the dialog in place (in the browser's top layer) instead of
// portaling it to <body>, so the content resets inherited text styles itself.

function Dialog(props: React.ComponentProps<typeof DialogRoot>) {
  return <DialogRoot {...props} />;
}

function DialogTrigger(props: React.ComponentProps<typeof DialogTriggerPart>) {
  return <DialogTriggerPart {...props} />;
}

function DialogClose(props: React.ComponentProps<typeof DialogClosePart>) {
  return <DialogClosePart {...props} />;
}

const fadeClassName =
  "transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0 motion-reduce:transition-none";

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: Omit<React.ComponentProps<typeof DialogContentPart>, "children"> & {
  children?: React.ReactNode;
  showCloseButton?: boolean;
}) {
  return (
    <>
      <DialogBackdrop
        className={cn(
          "fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px]",
          fadeClassName,
        )}
      />
      <DialogContentPart
        className={mergeClassName(
          cn(
            popupTextReset,
            "bg-background fixed inset-4 z-[1001] m-0 grid h-auto w-auto max-w-none gap-4 overflow-auto rounded-2xl border border-slate-200 p-6 text-[var(--text-color)] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.55)] outline-none sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:max-w-lg",
            fadeClassName,
          ),
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DialogClosePart
            aria-label="Close"
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-[var(--button-background)] focus:ring-offset-2 focus:outline-none disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon aria-hidden="true" />
          </DialogClosePart>
        ) : null}
      </DialogContentPart>
    </>
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitlePart>) {
  return (
    <DialogTitlePart
      className={mergeClassName(
        "m-0 text-lg leading-none font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescriptionPart>) {
  return (
    <DialogDescriptionPart
      className={mergeClassName("m-0 text-sm text-slate-500", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
};
