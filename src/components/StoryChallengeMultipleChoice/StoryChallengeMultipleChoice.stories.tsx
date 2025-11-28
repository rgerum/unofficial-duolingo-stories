import React from "react";
import StoryChallengeMultipleChoice from "./StoryChallengeMultipleChoice";
import StoryProgress from "../StoryProgress";

const meta = {
  component: StoryChallengeMultipleChoice,
  argTypes: {},
};

export default meta;

const parts = [
  {
    line: {
      type: "CHARACTER",
      content: {
        text: "Wat?",
        audio: {
          url: "audio/56/00ae35fc.mp3",
          ssml: {
            id: 56,
            text: "<speak>Wat?</speak>",
            speaker: "nl-NL-MaartenNeural(pitch=high)",
            plan_text: "Wat?",
            inser_index: 20,
            plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
          },
          keypoints: [
            {
              rangeEnd: 3,
              audioStart: 50,
            },
          ],
        },
        hints: ["What"],
        hintMap: [
          {
            rangeTo: 2,
            hintIndex: 0,
            rangeFrom: 0,
          },
        ],
      },
      avatarUrl:
        "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
      characterId: 100,
    },
    type: "LINE",
    audio: {
      url: "audio/56/00ae35fc.mp3",
      ssml: {
        id: 56,
        text: "<speak>Wat?</speak>",
        speaker: "nl-NL-MaartenNeural(pitch=high)",
        plan_text: "Wat?",
        inser_index: 20,
        plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
      },
      keypoints: [
        {
          rangeEnd: 3,
          audioStart: 50,
        },
      ],
    },
    editor: {
      end_no: 126,
      start_no: 121,
      active_no: 122,
      block_start_no: 121,
    },
    trackingProperties: {
      line_index: 0,
    },
    hideRangesForChallenge: [],
  },
  {
    type: "MULTIPLE_CHOICE",
    editor: {
      end_no: 131,
      start_no: 126,
      active_no: 127,
      block_start_no: 126,
    },
    answers: [
      {
        text: "Yes, that's true.",
        hints: [],
        hintMap: [],
      },
      {
        text: "No, that's not right.",
        hints: [],
        hintMap: [],
      },
    ],
    question: {
      text: "Paul en Julie zitten allebei met de verkeerde persoon aan tafel.",
      hints: [],
      hintMap: [],
    },
    correctAnswerIndex: 0,
    trackingProperties: {
      line_index: 0,
      challenge_type: "multiple-choice",
    },
  },
];

export const Normal = {
  render: (args) => {
    return <StoryProgress parts_list={[parts]} {...args} />;
  },
};
