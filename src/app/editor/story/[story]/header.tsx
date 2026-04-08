import React from "react";
import Link from "next/link";
import EditorButton from "../../editor_button";
import { EditorHeaderActions } from "../../_components/header_context";
import type { StoryData } from "./types";

type StoryNavigationTarget = {
  href: string;
  name: string;
};

declare global {
  interface Window {
    editorShowTranslations?: boolean;
    editorShowSsml?: boolean;
  }
}

type HeaderProps = {
  isAdmin: boolean;
  story_data: StoryData;
  unsaved_changes: boolean;
  func_save: () => Promise<void>;
  func_delete: () => Promise<void>;
  is_saving: boolean;
  is_deleting: boolean;
  last_saved_at: number | null;
  show_trans: boolean;
  set_show_trans: (show: boolean) => void;
  show_ssml: boolean;
  set_show_ssml: (show: boolean) => void;
  previous_story: StoryNavigationTarget | null;
  next_story: StoryNavigationTarget | null;
};

export function StoryEditorHeader({
  isAdmin,
  story_data,
  unsaved_changes,
  func_save,
  func_delete,
  is_saving,
  is_deleting,
  last_saved_at,
  show_trans,
  set_show_trans,
  show_ssml,
  set_show_ssml,
  previous_story,
  next_story,
}: HeaderProps) {
  function do_set_show_trans() {
    let value = !show_trans;
    const event = new CustomEvent("editorShowTranslations", {
      detail: { show: value },
    });
    window.dispatchEvent(event);
    window.editorShowTranslations = value;
    set_show_trans(value);
    window.requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent("resize")),
    );
  }

  function do_set_show_ssml() {
    let value = !show_ssml;
    const event = new CustomEvent("editorShowSsml", {
      detail: { show: value },
    });

    window.dispatchEvent(event);
    window.editorShowSsml = value;
    set_show_ssml(value);
    window.requestAnimationFrame(() =>
      window.dispatchEvent(new CustomEvent("resize")),
    );
  }

  async function Save() {
    if (is_saving || is_deleting) return;
    try {
      await func_save();
    } catch (e) {
      console.log("error save", e);
    }
  }

  async function Delete() {
    if (is_saving || is_deleting) return;
    if (confirm("Are you sure that you want to delete this story?")) {
      try {
        await func_delete();
      } catch (e) {
        console.log("error delete", e);
      }
    }
  }

  return (
    <EditorHeaderActions>
      <div className="flex items-center">
        <StoryNavButton
          href={previous_story?.href}
          label="Previous"
          title={previous_story?.name}
          compactIconDirection="left"
        />
        <StoryNavButton
          href={next_story?.href}
          label="Next"
          title={next_story?.name}
          compactIconDirection="right"
        />
        <EditorButton
          style={{ marginLeft: "auto" }}
          id="button_delete"
          onClick={Delete}
          img={"delete.svg"}
          text={is_deleting ? "Deleting..." : "Delete"}
          disabled={is_saving || is_deleting}
        />
        <EditorButton
          onClick={do_set_show_trans}
          checked={show_trans}
          text={"Hints"}
        />
        <EditorButton
          onClick={do_set_show_ssml}
          checked={show_ssml}
          text={"Audio"}
        />
        <div className="relative">
          <EditorButton
            id="button_save"
            onClick={Save}
            img={"save.svg"}
            text={
              (is_saving ? "Saving..." : "Save") + (unsaved_changes ? "*" : "")
            }
            disabled={is_saving || is_deleting}
            title={
              story_data.official && !isAdmin
                ? "Only admins can overwrite official stories."
                : undefined
            }
          />
          {last_saved_at ? <SaveStatus lastSavedAt={last_saved_at} /> : null}
        </div>
      </div>
    </EditorHeaderActions>
  );
}

export function StoryEditorHeaderLoading() {
  return (
    <EditorHeaderActions>
      <div className="flex items-center">
        <StoryNavButton
          label="Previous"
          compactIconDirection="left"
          disabled={true}
        />
        <StoryNavButton
          label="Next"
          compactIconDirection="right"
          disabled={true}
        />
        <EditorButton
          style={{ marginLeft: "auto" }}
          id="button_delete_loading"
          onClick={() => {}}
          img={"delete.svg"}
          text={"Delete"}
          disabled={true}
        />
        <EditorButton
          onClick={() => {}}
          checked={false}
          text={"Hints"}
          disabled={true}
        />
        <EditorButton
          onClick={() => {}}
          checked={false}
          text={"Audio"}
          disabled={true}
        />
        <EditorButton
          id="button_save_loading"
          onClick={() => {}}
          img={"save.svg"}
          text={"Save"}
          disabled={true}
        />
      </div>
    </EditorHeaderActions>
  );
}

function SaveStatus({ lastSavedAt }: { lastSavedAt: number }) {
  return (
    <div className="pointer-events-none absolute left-1/2 top-[calc(100%-18px)] z-10 -translate-x-1/2 whitespace-nowrap text-[0.75rem] text-[var(--text-color-dim)]">
      {`Saved at ${new Date(lastSavedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`}
    </div>
  );
}

function StoryNavButton({
  href,
  label,
  title,
  compactIconDirection,
  disabled = false,
}: {
  href?: string;
  label: string;
  title?: string;
  compactIconDirection: "left" | "right";
  disabled?: boolean;
}) {
  const className =
    "px-3 py-2 text-center text-sm text-[var(--text-color-dim)] no-underline transition-colors hover:text-[var(--text-color)]";
  const content = (
    <>
      <span className="max-[1100px]:hidden">{label}</span>
      <span className="min-[1101px]:hidden">
        <ChevronIcon direction={compactIconDirection} />
      </span>
    </>
  );

  if (!href || disabled) {
    return (
      <span
        className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px] cursor-default opacity-50`}
        aria-disabled="true"
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      title={title}
      className={`${className} hidden min-[701px]:block min-[701px]:min-w-[48px] min-[1101px]:min-w-[86px]`}
    >
      {content}
    </Link>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="inline-block h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "left" ? (
        <path d="M10 3.5 5.5 8 10 12.5" />
      ) : (
        <path d="M6 3.5 10.5 8 6 12.5" />
      )}
    </svg>
  );
}
