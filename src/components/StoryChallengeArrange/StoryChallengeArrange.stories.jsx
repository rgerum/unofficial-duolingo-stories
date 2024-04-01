import StoryChallengeArrange from "./StoryChallengeArrange";
import StoryProgress from "../StoryProgress";

const meta = {
  component: StoryChallengeArrange,
  argTypes: {},
};

export default meta;

const parts = [
  {
    type: "CHALLENGE_PROMPT",
    editor: {
      end_no: 68,
      start_no: 66,
      active_no: 67,
      block_start_no: 66,
    },
    prompt: {
      text: "Put the words in the right order:",
      hints: [],
      hintMap: [],
    },
    trackingProperties: {
      line_index: 0,
      challenge_type: "arrange",
    },
  },
  {
    line: {
      type: "CHARACTER",
      content: {
        text: "Nee, ik ben Engels",
        audio: {
          url: "audio/56/971ccce8.mp3",
          ssml: {
            id: 56,
            text: "<speak>Nee, ik ben Engels</speak>",
            speaker: "nl-NL-MaartenNeural(pitch=high)",
            plan_text: "[(Nee), (ik) (ben) (Engels)]",
            inser_index: 10,
            plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
          },
          keypoints: [
            {
              rangeEnd: 3,
              audioStart: 50,
            },
            {
              rangeEnd: 6,
              audioStart: 687,
            },
            {
              rangeEnd: 10,
              audioStart: 837,
            },
            {
              rangeEnd: 17,
              audioStart: 1062,
            },
          ],
        },
        hints: ["No", "I", "am", "English"],
        hintMap: [
          {
            rangeTo: 2,
            hintIndex: 0,
            rangeFrom: 0,
          },
          {
            rangeTo: 6,
            hintIndex: 1,
            rangeFrom: 5,
          },
          {
            rangeTo: 10,
            hintIndex: 2,
            rangeFrom: 8,
          },
          {
            rangeTo: 17,
            hintIndex: 3,
            rangeFrom: 12,
          },
        ],
      },
      avatarUrl:
        "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
      characterId: 100,
    },
    type: "LINE",
    audio: {
      url: "audio/56/971ccce8.mp3",
      ssml: {
        id: 56,
        text: "<speak>Nee, ik ben Engels</speak>",
        speaker: "nl-NL-MaartenNeural(pitch=high)",
        plan_text: "[(Nee), (ik) (ben) (Engels)]",
        inser_index: 10,
        plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
      },
      keypoints: [
        {
          rangeEnd: 3,
          audioStart: 50,
        },
        {
          rangeEnd: 6,
          audioStart: 687,
        },
        {
          rangeEnd: 10,
          audioStart: 837,
        },
        {
          rangeEnd: 17,
          audioStart: 1062,
        },
      ],
    },
    editor: {
      end_no: 72,
      start_no: 68,
    },
    trackingProperties: {
      line_index: 0,
    },
    hideRangesForChallenge: [
      {
        end: 18,
        start: 0,
      },
    ],
  },
  {
    type: "ARRANGE",
    editor: {
      end_no: 72,
      start_no: 68,
    },
    phraseOrder: [3, 2, 0, 1],
    selectablePhrases: ["Engels", "ben", "Nee", "ik"],
    characterPositions: [5, 8, 12, 18],
    trackingProperties: {
      line_index: 0,
      challenge_type: "arrange",
    },
  },
];

export const Normal = {
  render: (args) => (
    <StoryProgress parts_list={[parts]} {...args}></StoryProgress>
  ),
};
