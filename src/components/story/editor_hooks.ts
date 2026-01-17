import React from "react";
import type { EditorStateType } from "@/app/editor/story/[story]/editor";

interface EditorBlock {
  block_start_no?: number;
  start_no?: number;
  end_no?: number;
  active_no?: number;
}

export function EditorHook(
  hidden: string,
  editor: EditorBlock | undefined,
  editor_props: EditorStateType | undefined,
): [string, (() => void) | undefined] {
  let onClick: (() => void) | undefined;
  const view = editor_props?.view;

  if (editor_props) {
    hidden = "";
  }

  if (editor && view) {
    onClick = () => {
      if (editor.active_no) editor_props.select(editor.active_no);
      else if (editor.start_no) editor_props.select(editor.start_no);
    };
  }

  const [selected] = React.useState(false);
  if (selected) hidden = "story_selection";

  return [hidden, onClick];
}

export function EditorNoHook(
  hidden: string,
  editor: EditorBlock | undefined,
  editor_props: EditorStateType | undefined,
  selected: boolean,
): [string, (() => void) | undefined] {
  let onClick: (() => void) | undefined;
  const view = editor_props?.view;

  if (editor_props) {
    hidden = "";
  }

  if (editor && view) {
    hidden = "";
    onClick = () => {
      if (editor.active_no) editor_props.select(editor.active_no, true);
      else if (editor.start_no) editor_props.select(editor.start_no, true);
    };
  }

  if (selected) hidden = "story_selection";

  return [hidden, onClick];
}
