import React from "react";
import styles from "./header.module.css";
import EditorButton from "../../editor_button";
import { LoggedInButtonWrappedClient } from "@/components/login/LoggedInButtonWrappedClient";
import { Breadcrumbs } from "../../_components/breadcrumbs";
import { HeaderProps } from "./types";

export function StoryEditorHeader({
  story_data,
  unsaved_changes,
  language_data,
  language_data2,
  func_save,
  func_delete,
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

  const [save_text, set_save_text] = React.useState("Save");

  async function Save() {
    try {
      set_save_text("Saving...");
      func_save();
    } catch (e) {
      console.log("error save", e);
      window.alert("Story could not be saved.");
    }
    set_save_text("Save");
    const saveButton = document.querySelector(
      "#button_save span",
    ) as HTMLSpanElement;
    if (saveButton) saveButton.innerText = "Save";
  }

  async function Delete() {
    if (confirm("Are you sure that you want to delete this story?")) {
      const deleteButton = document.querySelector(
        "#button_delete span",
      ) as HTMLSpanElement;
      if (deleteButton) deleteButton.innerText = "Deleting";
      try {
        func_delete();
      } catch (e) {
        console.log("error delete", e);
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
      <div className={styles.toolbar}>
        <div className={styles.AvatarEditorHeader}>
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
              { type: "story", data: story_data, href: `#` },
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
            text={save_text + (unsaved_changes ? "*" : "")}
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
