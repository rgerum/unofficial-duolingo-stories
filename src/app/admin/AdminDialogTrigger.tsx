"use client";

import type { ReactNode } from "react";
import {
  buttonInnerClassName,
  buttonRootClassName,
} from "@/components/ui/button";
import * as EditDialog from "./edit_dialog";

interface AdminDialogTriggerProps {
  children: ReactNode;
  isNew?: boolean;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export default function AdminDialogTrigger({
  children,
  isNew,
  onOpenChange,
  open,
}: AdminDialogTriggerProps) {
  return (
    <EditDialog.Root open={open} onOpenChange={onOpenChange}>
      <EditDialog.Trigger asChild>
        <button
          className={buttonRootClassName({ className: "ml-auto" })}
          type="button"
        >
          <span className={buttonInnerClassName({})}>
            {isNew ? "Add" : "Edit"}
          </span>
        </button>
      </EditDialog.Trigger>
      {children}
    </EditDialog.Root>
  );
}
