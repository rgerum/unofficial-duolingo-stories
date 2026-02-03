export type Audio = {
  ssml: {
    text: string;
    speaker: string;
    id: number;
    inser_index: number;
    plan_text?: string | undefined;
    plan_text_speaker_name?: string | undefined;
    mapping?: Record<number, number>;
  };
  url: undefined | string;
  keypoints: undefined | { rangeEnd: number; audioStart: number }[];
  markers?: number[];
};

// Core Types
interface HintMapItem {
  hintIndex: number;
  rangeFrom: number;
  rangeTo: number;
}

export interface HintMapResult {
  hintMap: HintMapItem[];
  hints: string[];
  text: string;
  audio?: Audio;
  lang_hints?: string;
}

export interface ContentWithHints {
  hintMap: HintMapItem[];
  text: string;
  [key: string]: any; // For additional properties
}

export interface HideRange {
  start: number;
  end: number;
}

export type LineElementCharacter = {
  type: "CHARACTER";
  avatarUrl?: string;
  characterId: number | string;
  characterName?: string;
  content: ContentWithHints;
};
export type LineElementProse = {
  type: "PROSE";
  content: ContentWithHints;
};
export type LineElementTitle = {
  type: "TITLE";
  content: ContentWithHints;
};
export type LineElement =
  | LineElementCharacter
  | LineElementProse
  | LineElementTitle;

export type StoryElementHeader = {
  type: "HEADER";
  illustrationUrl: string;
  title: string;
  learningLanguageTitleContent: ContentWithHints;
  trackingProperties: { line_index: 0 };
  audio?: Audio;
  lang: string;
  editor: {
    block_start_no?: number;
    start_no?: number;
    end_no?: number;
    active_no?: number;
  };
};

export type StoryElementLine = {
  type: "LINE";
  hideRangesForChallenge?: HideRange[];
  line: LineElement;
  trackingProperties: { line_index: number; [key: string]: any };
  audio?: Audio;
  lang: string;
  editor: {
    block_start_no?: number;
    start_no?: number;
    end_no?: number;
    active_no?: number;
  };
};

export type StoryElementMultipleChoice = {
  type: "MULTIPLE_CHOICE";
  answers: (string | HintMapResult)[];
  correctAnswerIndex: number;
  question?: ContentWithHints;
  trackingProperties: {
    line_index: number;
    challenge_type: "multiple-choice" | "continuation";
  };
  lang: string;
  editor: {
    block_start_no?: number;
    start_no?: number;
    end_no?: number;
    active_no?: number;
  };
};

export type StoryElementChallengePrompt = {
  type: "CHALLENGE_PROMPT";
  prompt: ContentWithHints;
  trackingProperties: {
    line_index: number;
    challenge_type: "select-phrases" | "continuation" | "arrange";
  };
  lang: string;
  editor: {
    block_start_no?: number;
    start_no?: number;
    end_no?: number;
    active_no?: number;
  };
};

export type StoryElementSelectPhrase = {
  type: "SELECT_PHRASE";
  answers: (string | HintMapResult)[];
  correctAnswerIndex: number;
  trackingProperties: {
    line_index: number;
    challenge_type: "select-phrases";
  };
  lang: string;
  editor: { start_no?: number; end_no?: number; block_start_no?: number };
};

export type StoryElementArrange = {
  type: "ARRANGE";
  characterPositions?: number[];
  phraseOrder: number[];
  selectablePhrases: string[];
  trackingProperties: {
    line_index: number;
    challenge_type: "arrange";
  };
  lang: string;
  editor: { start_no?: number; end_no?: number; block_start_no?: number };
};

export type StoryElementPointToPhrase = {
  type: "POINT_TO_PHRASE";
  correctAnswerIndex: number;
  transcriptParts: { selectable: boolean; text: string }[];
  question: ContentWithHints;
  trackingProperties: {
    line_index: number;
    challenge_type: "point-to-phrase";
  };
  lang_question: string;
  lang: string;
  editor: {
    block_start_no?: number;
    start_no?: number;
    end_no?: number;
    active_no?: number;
  };
};

export type StoryElementMatch = {
  type: "MATCH";
  fallbackHints: { phrase: string; translation: string }[];
  prompt: string;
  trackingProperties: {
    line_index: number;
    challenge_type: "match";
  };
  lang: string;
  lang_question: string;
  editor: {
    block_start_no?: number;
    start_no?: number;
    end_no?: number;
    active_no?: number;
  };
};

export type StoryElementError = {
  type: "ERROR";
  text: string;
  trackingProperties: {
    line_index: number;
    challenge_type: "error";
  };
};

export type StoryElement =
  | StoryElementHeader
  | StoryElementLine
  | StoryElementMultipleChoice
  | StoryElementChallengePrompt
  | StoryElementSelectPhrase
  | StoryElementArrange
  | StoryElementPointToPhrase
  | StoryElementMatch
  | StoryElementError;
