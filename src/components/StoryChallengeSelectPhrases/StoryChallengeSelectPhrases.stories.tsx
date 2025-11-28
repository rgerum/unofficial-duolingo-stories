import StoryChallengeSelectPhrases from "./StoryChallengeSelectPhrases";
import StoryProgress from "../StoryProgress";

const meta = {
  component: StoryChallengeSelectPhrases,
  argTypes: {},
};

export default meta;

const parts = [
  {
    type: "CHALLENGE_PROMPT",
    editor: {
      end_no: 89,
      start_no: 87,
      active_no: 88,
      block_start_no: 87,
    },
    prompt: {
      text: "Choose the best answer:",
      hints: [],
      hintMap: [],
    },
    trackingProperties: {
      line_index: 0,
      challenge_type: "select-phrases",
    },
  },
  {
    line: {
      type: "CHARACTER",
      content: {
        text: "Heb je een huisdier?",
        audio: {
          url: "audio/56/ddacf426.mp3",
          ssml: {
            id: 56,
            text: "<speak>Heb je      een  huisdier?</speak>",
            speaker: "nl-NL-MaartenNeural(pitch=high)",
            plan_text: "Heb~je      een  [huisdier]?",
            inser_index: 14,
            plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
          },
          keypoints: [
            {
              rangeEnd: 3,
              audioStart: 50,
            },
            {
              rangeEnd: 6,
              audioStart: 275,
            },
            {
              rangeEnd: 10,
              audioStart: 400,
            },
            {
              rangeEnd: 19,
              audioStart: 500,
            },
          ],
        },
        hints: ["Do you have", "a", "pet"],
        hintMap: [
          {
            rangeTo: 5,
            hintIndex: 0,
            rangeFrom: 0,
          },
          {
            rangeTo: 9,
            hintIndex: 1,
            rangeFrom: 7,
          },
          {
            rangeTo: 18,
            hintIndex: 2,
            rangeFrom: 11,
          },
        ],
      },
      avatarUrl:
        "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
      characterId: 100,
    },
    type: "LINE",
    audio: {
      url: "audio/56/ddacf426.mp3",
      ssml: {
        id: 56,
        text: "<speak>Heb je      een  huisdier?</speak>",
        speaker: "nl-NL-MaartenNeural(pitch=high)",
        plan_text: "Heb~je      een  [huisdier]?",
        inser_index: 14,
        plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
      },
      keypoints: [
        {
          rangeEnd: 3,
          audioStart: 50,
        },
        {
          rangeEnd: 6,
          audioStart: 275,
        },
        {
          rangeEnd: 10,
          audioStart: 400,
        },
        {
          rangeEnd: 19,
          audioStart: 500,
        },
      ],
    },
    editor: {
      end_no: 92,
      start_no: 89,
    },
    trackingProperties: {
      line_index: 0,
    },
    hideRangesForChallenge: [
      {
        end: 19,
        start: 11,
      },
    ],
  },
  {
    type: "SELECT_PHRASE",
    editor: {
      end_no: 96,
      start_no: 92,
    },
    answers: ["huisdier", "huisdieren", "thuisbeest"],
    correctAnswerIndex: 0,
    trackingProperties: {
      line_index: 0,
      challenge_type: "select-phrases",
    },
  },
];

export const Normal = {
  render: () => <StoryProgress parts_list={[parts]}></StoryProgress>,
};
