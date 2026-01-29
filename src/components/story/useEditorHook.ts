import type { EditorStateType } from "@/app/editor/story/[story]/editor";

export interface EditorBlock {
  block_start_no?: number;
  start_no?: number;
  end_no?: number;
  active_no?: number;
}

export interface EditorProps {
  editorState?: EditorStateType;
  editorBlock?: EditorBlock;
}

export function useEditorHook(editorProps?: EditorProps): {
  isEditorMode: boolean;
  forceVisible: boolean;
  onClick: (() => void) | undefined;
} {
  const editorState = editorProps?.editorState;
  const editorBlock = editorProps?.editorBlock;
  const view = editorState?.view;

  let onClick: (() => void) | undefined;

  if (editorBlock && view && editorState) {
    onClick = () => {
      if (editorBlock.active_no) {
        editorState.select(String(editorBlock.active_no), false);
      } else if (editorBlock.start_no) {
        editorState.select(String(editorBlock.start_no), false);
      }
    };
  }

  return {
    isEditorMode: !!editorState,
    forceVisible: !!editorState,
    onClick,
  };
}
