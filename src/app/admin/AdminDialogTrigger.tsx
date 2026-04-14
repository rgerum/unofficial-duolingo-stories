import type React from "react";
import * as EditDialog from "./edit_dialog";
import {
  buttonInnerClassName,
  buttonRootClassName,
} from "@/components/ui/button";

interface AdminDialogTriggerProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNew?: boolean;
  children: React.ReactNode;
}

export default function AdminDialogTrigger({
  open,
  setOpen,
  isNew = false,
  children,
}: AdminDialogTriggerProps) {
  return (
    <EditDialog.Root open={open} onOpenChange={setOpen}>
      <EditDialog.Trigger asChild>
        <button
          type="button"
          className={buttonRootClassName({ className: "ml-auto" })}
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
