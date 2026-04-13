import type { EditorView } from "codemirror";
import type {
  Audio,
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { type processStoryFile } from "@/components/editor/story/syntax_parser_new";
import type { AudioInsertAnchor } from "@/lib/editor/audio/audio_edit_tools";

type AudioInsertLinesType = ReturnType<typeof processStoryFile>[2];

export type EditorStateType = {
  line_no: number;
  view: EditorView;
  select: (line: string, scroll: boolean) => void;
  audio_insert_lines: AudioInsertLinesType | undefined;
  create_audio_insert_anchor: (
    ssml: Audio["ssml"],
  ) => AudioInsertAnchor | undefined;
  track_audio_insert_anchor: (anchor: AudioInsertAnchor) => () => void;
  insert_audio_at_anchor: (text: string, anchor: AudioInsertAnchor) => void;
  show_audio_editor: (data: StoryElementLine | StoryElementHeader) => void;
};
