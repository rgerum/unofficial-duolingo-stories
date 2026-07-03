import StoryHeaderStickyFixture from "./story_header_sticky_fixture";
import type { StoryData } from "@/app/(stories)/story/[story_id]/getStory";
import type {
  ContentWithHints,
  StoryElement,
} from "@/components/editor/story/syntax_parser_types";

export const metadata = {
  title: "Story Header Sticky Fixture",
};

function content(text: string, hints: string[] = []): ContentWithHints {
  return {
    text,
    hints,
    hintMap: [],
  };
}

const vikramAvatar =
  "https://stories-cdn.duolingo.com/avatar/0bca7d464fe8c3ca78645d5201323a7e.svg";
const pritiAvatar =
  "https://stories-cdn.duolingo.com/avatar/6e4c0a7562f184ff8cd5d25b6dd9c5f7.svg";

const elements: StoryElement[] = [
  {
    type: "HEADER",
    illustrationUrl:
      "https://stories-cdn.duolingo.com/image/643347b755001a918130ddf5f6d3e914e63a00ce.svg",
    title: "The Passport",
    learningLanguageTitleContent: content("Het Paspoort", ["the passport"]),
    trackingProperties: { line_index: 0 },
    lang: "nl",
    editor: { block_start_no: 1 },
  },
  {
    type: "LINE",
    line: {
      type: "PROSE",
      content: content("Vikram en zijn vrouw Priti zijn op het vliegveld.", [
        "Vikram and his wife Priti are at the airport",
      ]),
    },
    trackingProperties: { line_index: 1 },
    lang: "nl",
    editor: { block_start_no: 2 },
  },
  {
    type: "LINE",
    line: {
      type: "CHARACTER",
      avatarUrl: vikramAvatar,
      characterId: 593,
      characterName: "Vikram",
      content: content("O jee, waar is mijn paspoort?", [
        "oh no where is my passport",
      ]),
    },
    trackingProperties: { line_index: 2 },
    lang: "nl",
    editor: { block_start_no: 3 },
  },
  {
    type: "LINE",
    line: {
      type: "CHARACTER",
      avatarUrl: vikramAvatar,
      characterId: 593,
      characterName: "Vikram",
      content: content("Het is niet hier!", ["it's not here"]),
    },
    trackingProperties: { line_index: 3 },
    lang: "nl",
    editor: { block_start_no: 4 },
  },
  {
    type: "LINE",
    line: {
      type: "CHARACTER",
      avatarUrl: pritiAvatar,
      characterId: 560,
      characterName: "Priti",
      content: content("Vikram...", ["Vikram"]),
    },
    trackingProperties: { line_index: 4 },
    lang: "nl",
    editor: { block_start_no: 5 },
  },
  {
    type: "CHALLENGE_PROMPT",
    prompt: content("Select the missing phrase"),
    trackingProperties: {
      line_index: 5,
      challenge_type: "select-phrases",
    },
    lang: "en",
    editor: { block_start_no: 6 },
  },
  {
    type: "LINE",
    hideRangesForChallenge: [{ start: 13, end: 24 }],
    line: {
      type: "CHARACTER",
      avatarUrl: vikramAvatar,
      characterId: 593,
      characterName: "Vikram",
      content: content("Het zit niet in mijn tas...", ["it's not in my bag"]),
    },
    trackingProperties: {
      line_index: 5,
      challenge_type: "select-phrases",
    },
    lang: "nl",
    editor: { block_start_no: 7 },
  },
  {
    type: "SELECT_PHRASE",
    answers: ["in mijn tas", "in mijn jas", "in zijn tas"],
    correctAnswerIndex: 0,
    trackingProperties: {
      line_index: 5,
      challenge_type: "select-phrases",
    },
    lang: "nl",
    editor: { block_start_no: 8 },
  },
  {
    type: "LINE",
    line: {
      type: "CHARACTER",
      avatarUrl: vikramAvatar,
      characterId: 593,
      characterName: "Vikram",
      content: content("En het zit niet in mijn jack", [
        "and it's not in my jacket",
      ]),
    },
    trackingProperties: { line_index: 6 },
    lang: "nl",
    editor: { block_start_no: 9 },
  },
];

const story = {
  elements,
  id: 5388,
  set_id: 2,
  course_id: 1,
  from_language: "en",
  from_language_id: 1,
  from_language_long: "English",
  from_language_rtl: false,
  from_language_name: "The Passport",
  learning_language: "nl",
  learning_language_long: "Dutch",
  learning_language_rtl: false,
  course_short: "nl-en",
  illustrations: {
    active:
      "https://stories-cdn.duolingo.com/image/643347b755001a918130ddf5f6d3e914e63a00ce.svg",
    gilded:
      "https://stories-cdn.duolingo.com/image/643347b755001a918130ddf5f6d3e914e63a00ce.svg",
    locked:
      "https://stories-cdn.duolingo.com/image/643347b755001a918130ddf5f6d3e914e63a00ce.svg",
  },
} as StoryData;

export default function Page() {
  return <StoryHeaderStickyFixture story={story} />;
}
