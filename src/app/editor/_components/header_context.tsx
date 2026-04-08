"use client";

import React from "react";
import { createPortal } from "react-dom";

type EditorHeaderSlotName = "breadcrumbs" | "actions";

type EditorHeaderContextValue = {
  slots: Record<EditorHeaderSlotName, HTMLDivElement | null>;
  setSlot: (slot: EditorHeaderSlotName, element: HTMLDivElement | null) => void;
};

const EditorHeaderContext =
  React.createContext<EditorHeaderContextValue | null>(null);

export function EditorHeaderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [slots, setSlots] = React.useState<
    Record<EditorHeaderSlotName, HTMLDivElement | null>
  >({
    breadcrumbs: null,
    actions: null,
  });

  const setSlot = React.useCallback(
    (slot: EditorHeaderSlotName, element: HTMLDivElement | null) => {
      setSlots((current) => {
        if (current[slot] === element) return current;
        return { ...current, [slot]: element };
      });
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      slots,
      setSlot,
    }),
    [setSlot, slots],
  );

  return (
    <EditorHeaderContext.Provider value={value}>
      {children}
    </EditorHeaderContext.Provider>
  );
}

function useEditorHeaderContext() {
  const context = React.useContext(EditorHeaderContext);
  if (!context) {
    throw new Error("Editor header context is missing.");
  }
  return context;
}

export function useEditorHeaderSlotRef(slot: EditorHeaderSlotName) {
  const { setSlot } = useEditorHeaderContext();

  return React.useCallback(
    (element: HTMLDivElement | null) => {
      setSlot(slot, element);
    },
    [setSlot, slot],
  );
}

function EditorHeaderPortal({
  children,
  slot,
}: {
  children: React.ReactNode;
  slot: EditorHeaderSlotName;
}) {
  const { slots } = useEditorHeaderContext();
  const target = slots[slot];

  if (!target) return null;

  return createPortal(children, target);
}

export function EditorHeaderBreadcrumbs({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorHeaderPortal slot="breadcrumbs">{children}</EditorHeaderPortal>;
}

export function EditorHeaderActions({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EditorHeaderPortal slot="actions">{children}</EditorHeaderPortal>;
}
