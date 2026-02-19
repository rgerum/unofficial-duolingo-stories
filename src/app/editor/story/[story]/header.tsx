import React from "react";
import EditorButton from "../../editor_button";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import type { StoryData } from "./types";

declare global {
  interface Window {
    editorShowTranslations?: boolean;
    editorShowSsml?: boolean;
  }
}

type HeaderProps = {
  story_data: StoryData;
  unsaved_changes: boolean;
  language_data?: {
    id: number;
    name: string;
    short: string;
    flag: number | null;
    flag_file: string | null;
    speaker: string | null;
    default_text: string;
    tts_replace: string | null;
    public: boolean;
    rtl: boolean;
  };
  language_data2?: {
    id: number;
    name: string;
    short: string;
    flag: number | null;
    flag_file: string | null;
    speaker: string | null;
    default_text: string;
    tts_replace: string | null;
    public: boolean;
    rtl: boolean;
  };
  func_save: () => Promise<void>;
  func_delete: () => Promise<void>;
  is_saving: boolean;
  show_trans: boolean;
  set_show_trans: (show: boolean) => void;
  show_ssml: boolean;
  set_show_ssml: (show: boolean) => void;
};

export function StoryEditorHeader({
  story_data,
  unsaved_changes,
  language_data,
  language_data2,
  func_save,
  func_delete,
  is_saving,
  show_trans,
  set_show_trans,
  show_ssml,
  set_show_ssml,
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
    if (is_saving) return;
    try {
      await func_save();
    } catch (e) {
      console.log("error save", e);
    }
  }

  async function Delete() {
    if (confirm("Are you sure that you want to delete this story?")) {
      const deleteButton = document.querySelector(
        "#button_delete span",
      ) as HTMLSpanElement;
      if (deleteButton) deleteButton.innerText = "Deleting";
      try {
        await func_delete();
      } catch (e) {
        //console.log("error delete", e);
        const deleteButton = document.querySelector(
          "#button_delete span",
        ) as HTMLSpanElement;
        if (deleteButton) deleteButton.innerText = "Delete";
        window.alert("Story could not be deleted");
      }
    }
  }

  return (
    <>
      <div className="flex h-[60px] border-b-2 border-[var(--header-border)]">
        <div className="flex w-full items-center px-5 max-[975px]:[&>div:last-child]:hidden">
          <Breadcrumbs
            path={[
              { type: "Editor", href: `/editor` },
              { type: "sep", href: "#" },
              {
                type: "course",
                lang1: language_data,
                lang2: language_data2,
                href: `/editor/course/${story_data?.short}`,
              },
              { type: "sep", href: "#" },
              { type: "story", href: `#`, data: story_data },
            ]}
          />

          <EditorButton
            style={{ marginLeft: "auto" }}
            id="button_delete"
            onClick={Delete}
            img={"delete.svg"}
            text={"Delete"}
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

          <EditorButton
            id="button_save"
            onClick={Save}
            img={"save.svg"}
            text={
              (is_saving ? "Saving..." : "Save") + (unsaved_changes ? "*" : "")
            }
            disabled={is_saving}
          />
          <LoggedInButtonWrappedClient
            page={"editor"}
            course_id={story_data?.short}
          />
        </div>
      </div>
    </>
  );
}
