"use client";

import React from "react";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";
import { useEditorHeaderSlotRef } from "./header_context";
import EditorCommandPalette from "./editor_command_palette";

export default function EditorHeaderShell() {
  const breadcrumbsRef = useEditorHeaderSlotRef("breadcrumbs");
  const actionsRef = useEditorHeaderSlotRef("actions");

  return (
    <nav className="flex h-[60px] min-w-0 items-center gap-4 border-b-2 border-[var(--header-border)] bg-[var(--body-background)] px-5">
      <div
        ref={breadcrumbsRef}
        className="flex min-w-0 flex-1 items-center overflow-hidden"
      />
      <div className="ml-auto flex min-w-0 items-center gap-2">
        <EditorCommandPalette />
        <div
          ref={actionsRef}
          className="flex min-w-0 items-center justify-end max-[975px]:overflow-x-auto"
        />
        <LoggedInButtonWrappedClient page={"editor"} course_id={"segment"} />
      </div>
    </nav>
  );
}
