export interface StoryElement {
  type: string;
  trackingProperties: {
    line_index: number;
  };
  content?: string;
  learningLanguageTitleContent?: string;
}

export interface StoryState {
  elements: StoryElement[];
}

export interface EditorState {
  view: any;
  audio_insert_lines: any;
}

export interface AudioEditorData {
  trackingProperties: {
    line_index: number;
  };
  line?: {
    content: string;
  };
  learningLanguageTitleContent?: string;
  audio: {
    ssml: string;
    url: string;
    keypoints: Array<{
      rangeEnd: number;
      audioStart: number;
    }>;
  };
}

export interface LanguageData {
  short: string;
  rtl: boolean;
  tts_replace: any;
}

export interface StoryMeta {
  fromLanguageName: string;
  icon: number;
  set_id: string;
  set_index: string;
  todo_count: number;
  from_language_name: string;
  cast: Array<{
    id: number;
    link: string;
    speaker: string;
    name: string;
  }>;
}

export interface HeaderProps {
  story_data: any;
  unsaved_changes: boolean;
  language_data: LanguageData | undefined;
  language_data2: LanguageData | undefined;
  func_save: () => Promise<void>;
  func_delete: () => Promise<void>;
  show_trans: boolean;
  set_show_trans: (value: boolean) => void;
  show_ssml: boolean;
  set_show_ssml: (value: boolean) => void;
}

declare global {
  interface Window {
    editorShowTranslations: boolean;
    editorShowSsml: boolean;
  }
}
