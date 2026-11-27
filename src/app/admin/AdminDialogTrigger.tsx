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
      <EditDialog.Trigger
        className={buttonRootClassName({ className: "ml-auto" })}
      >
        <span className={buttonInnerClassName({})}>
          {isNew ? "Add" : "Edit"}
        </span>
      </EditDialog.Trigger>
      {children}
    </EditDialog.Root>
  );
}
