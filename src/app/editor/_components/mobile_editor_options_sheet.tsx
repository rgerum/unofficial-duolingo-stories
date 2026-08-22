"use client";

import { EllipsisIcon } from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function MobileEditorOptionsSheet({
  title,
  triggerLabel,
  children,
  open,
  onOpenChange,
}: {
  title: string;
  triggerLabel: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={triggerLabel}
          className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-color)] transition-colors hover:bg-[var(--header-border)]"
        >
          <EllipsisIcon className="size-6" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="max-h-[min(82dvh,38rem)] overflow-y-auto rounded-t-3xl border-[var(--header-border)] bg-[var(--body-background)] p-0 pb-[env(safe-area-inset-bottom)] text-[var(--text-color)]"
      >
        <SheetHeader className="border-b border-[var(--header-border)]">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
