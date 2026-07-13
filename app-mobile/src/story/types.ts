// Story element types, ported from src/components/editor/story/syntax_parser_types.ts
// (web app). Editor-only fields are kept optional so the same JSON parses.

export type AudioInfo = {
  url?: string;
  keypoints?: { rangeEnd: number; audioStart: number }[];
};

export type HintMapItem = {
  hintIndex: number;
  rangeFrom: number;
  rangeTo: number;
};

export type ContentWithHints = {
  hintMap: HintMapItem[];
  text: string;
  hints?: string[];
  hints_pronunciation?: string[];
  audio?: AudioInfo;
  lang_hints?: string;
  [key: string]: unknown;
};

export type HideRange = { start: number; end: number };

export type LineElement =
  | {
      type: "CHARACTER";
      avatarUrl?: string;
      characterId: number | string;
      characterName?: string;
      content: ContentWithHints;
    }
  | { type: "PROSE"; content: ContentWithHints }
  | { type: "TITLE"; content: ContentWithHints };

type TrackingProperties = {
  line_index: number;
  challenge_type?: string;
  [key: string]: unknown;
};

export type StoryElementHeader = {
  type: "HEADER";
  illustrationUrl: string;
  title: string;
  learningLanguageTitleContent: ContentWithHints;
  trackingProperties: TrackingProperties;
  audio?: AudioInfo;
  lang: string;
};

export type StoryElementLine = {
  type: "LINE";
  hideRangesForChallenge?: HideRange[];
  line: LineElement;
  trackingProperties: TrackingProperties;
  audio?: AudioInfo;
  lang: string;
};

export type StoryElementMultipleChoice = {
  type: "MULTIPLE_CHOICE";
  answers: (string | ContentWithHints)[];
  correctAnswerIndex: number;
  question?: ContentWithHints;
  trackingProperties: TrackingProperties;
  lang: string;
};

export type StoryElementChallengePrompt = {
  type: "CHALLENGE_PROMPT";
  prompt: ContentWithHints;
  trackingProperties: TrackingProperties;
  lang: string;
};

export type StoryElementSelectPhrase = {
  type: "SELECT_PHRASE";
  answers: (string | ContentWithHints)[];
  correctAnswerIndex: number;
  trackingProperties: TrackingProperties;
  lang: string;
};

export type StoryElementArrange = {
  type: "ARRANGE";
  characterPositions?: number[];
  phraseOrder: number[];
  selectablePhrases: string[];
  trackingProperties: TrackingProperties;
  lang: string;
};

export type StoryElementPointToPhrase = {
  type: "POINT_TO_PHRASE";
  correctAnswerIndex: number;
  transcriptParts: { selectable: boolean; text: string }[];
  question: ContentWithHints;
  trackingProperties: TrackingProperties;
  lang_question: string;
  lang: string;
};

export type StoryElementMatch = {
  type: "MATCH";
  fallbackHints: { phrase: string; translation: string }[];
  prompt: string;
  trackingProperties: TrackingProperties;
  lang: string;
  lang_question: string;
};

export type StoryElementError = {
  type: "ERROR";
  text: string;
  trackingProperties: TrackingProperties;
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

/** Shape returned by api.storyRead.getStoryByLegacyId. */
export type StoryData = {
  id: number;
  set_id: number;
  course_id: number;
  from_language: string;
  from_language_long: string;
  from_language_rtl: boolean;
  from_language_name: string;
  learning_language: string;
  learning_language_long: string;
  learning_language_rtl: boolean;
  course_short: string;
  course_tags: string[];
  elements: StoryElement[];
  illustrations?: { gilded?: string; active?: string; locked?: string };
};
