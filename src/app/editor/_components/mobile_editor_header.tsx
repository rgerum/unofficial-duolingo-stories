"use client";

import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import React from "react";
import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { EditorMobileHeader } from "./header_context";

export default function MobileEditorHeader({
  backHref,
  backLabel = "Back",
  icon,
  title,
  subtitle,
  children,
}: {
  backHref?: string;
  backLabel?: string;
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <EditorMobileHeader>
      <div className="absolute inset-0 z-20 flex items-center gap-1.5 bg-[var(--body-background)] px-2 min-[976px]:hidden">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-[var(--text-color)] no-underline transition-colors hover:bg-[var(--header-border)]"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
        ) : (
          <div className="size-11 shrink-0" />
        )}
        {icon}
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-semibold text-[var(--text-color)]">
            {title}
          </div>
          {subtitle ? (
            <div className="truncate text-xs text-[var(--text-color-dim)]">
              {subtitle}
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </EditorMobileHeader>
  );
}

export const mobileEditorMenuItemClassName =
  "flex min-h-12 items-center gap-3 rounded-xl px-3 text-left text-base font-medium text-[var(--text-color)] no-underline transition-colors hover:bg-[var(--header-border)]";

export function MobileEditorMenuLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn(mobileEditorMenuItemClassName, className)}
      >
        {children}
      </Link>
    </SheetClose>
  );
}
