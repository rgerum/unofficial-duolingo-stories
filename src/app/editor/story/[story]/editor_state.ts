import type { EditorView } from "codemirror";
import type {
  StoryElementHeader,
  StoryElementLine,
} from "@/components/editor/story/syntax_parser_types";
import { type processStoryFile } from "@/components/editor/story/syntax_parser_new";

type AudioInsertLinesType = ReturnType<typeof processStoryFile>[2];

export type EditorStateType = {
  line_no: number;
  view: EditorView;
  select: (line: string, scroll: boolean) => void;
  audio_insert_lines: AudioInsertLinesType | undefined;
  show_trans: boolean;
  show_audio_editor: (data: StoryElementLine | StoryElementHeader) => void;
  show_ssml: boolean;
};
