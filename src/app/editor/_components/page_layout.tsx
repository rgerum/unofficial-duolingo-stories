"use client";

import React from "react";
import EditorHeaderShell from "./header_shell";

export default function EditorPageLayout({
  children,
  contentClassName = "min-h-0 min-w-0 flex-1 overflow-auto",
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="flex h-[100dvh] min-h-0 flex-col">
      <EditorHeaderShell />
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
