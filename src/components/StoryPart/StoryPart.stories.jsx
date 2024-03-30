import StoryPart from "./StoryPart";

const meta = {
  component: StoryPart,
  argTypes: {},
};

export default meta;

const TEST_LINE = {
  trackingProperties: {
    line_index: 0,
  },

  line: {
    avatarUrl:
      "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
    characterId: 100,
    type: "CHARACTER",
    content: {
      text: "This is a test.",
      hintMap: [
        {
          rangeFrom: 0,
          rangeTo: 3,
          hintIndex: 0,
        },
        {
          rangeFrom: 6,
          rangeTo: 6,
          hintIndex: 1,
        },
        {
          rangeFrom: 8,
          rangeTo: 8,
          hintIndex: 2,
        },
      ],
      hints: ["Here", "am", "I"],
    },
  },
};

const elements = [
  {
    line: {
      type: "CHARACTER",
      content: {
        text: "Wat zou je willen eten?",
        audio: {
          url: "audio/56/ef375bfe.mp3",
          ssml: {
            id: 56,
            text: "<speak>Wat  zou je    willen eten?</speak>",
            speaker: "nl-NL-MaartenNeural(pitch=high)",
            plan_text: "Wat  zou~je    willen eten?",
            inser_index: 2,
            plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
          },
          keypoints: [
            {
              rangeEnd: 3,
              audioStart: 50,
            },
            {
              rangeEnd: 7,
              audioStart: 262,
            },
            {
              rangeEnd: 10,
              audioStart: 462,
            },
            {
              rangeEnd: 17,
              audioStart: 575,
            },
            {
              rangeEnd: 22,
              audioStart: 825,
            },
          ],
        },
        hints: ["What", "would you", "like", "for dinner?"],
        hintMap: [
          {
            rangeTo: 2,
            hintIndex: 0,
            rangeFrom: 0,
          },
          {
            rangeTo: 9,
            hintIndex: 1,
            rangeFrom: 4,
          },
          {
            rangeTo: 16,
            hintIndex: 2,
            rangeFrom: 11,
          },
          {
            rangeTo: 21,
            hintIndex: 3,
            rangeFrom: 18,
          },
        ],
      },
      avatarUrl:
        "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
      characterId: 100,
    },
    type: "LINE",
    audio: {
      url: "audio/56/ef375bfe.mp3",
      ssml: {
        id: 56,
        text: "<speak>Wat  zou je    willen eten?</speak>",
        speaker: "nl-NL-MaartenNeural(pitch=high)",
        plan_text: "Wat  zou~je    willen eten?",
        inser_index: 2,
        plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
      },
      keypoints: [
        {
          rangeEnd: 3,
          audioStart: 50,
        },
        {
          rangeEnd: 7,
          audioStart: 262,
        },
        {
          rangeEnd: 10,
          audioStart: 462,
        },
        {
          rangeEnd: 17,
          audioStart: 575,
        },
        {
          rangeEnd: 22,
          audioStart: 825,
        },
      ],
    },
    editor: {
      end_no: 25,
      start_no: 20,
      active_no: 21,
      block_start_no: 20,
    },
    trackingProperties: {
      line_index: 2,
    },
    hideRangesForChallenge: [],
  },
  {
    type: "MULTIPLE_CHOICE",
    editor: {
      end_no: 31,
      start_no: 25,
      active_no: 26,
      block_start_no: 25,
    },
    answers: [
      {
        text: "... what the food is.",
        hints: [],
        hintMap: [],
      },
      {
        text: "... what Julie wants to eat.",
        hints: [],
        hintMap: [],
      },
      {
        text: "... how much the food costs",
        hints: [],
        hintMap: [],
      },
    ],
    question: {
      text: "Paul wants to know ...",
      hints: [],
      hintMap: [],
    },
    correctAnswerIndex: 1,
    trackingProperties: {
      line_index: 2,
      challenge_type: "multiple-choice",
    },
  },
];

const story = {
  elements: [
    {
      type: "HEADER",
      audio: {
        url: "audio/56/badfe656.mp3",
        ssml: {
          id: 56,
          text: "<speak>Een Afspraakje</speak>",
          speaker: "nl-NL-FennaNeural(pitch=x-low)",
          plan_text: "Een Afspraakje",
          inser_index: 0,
          plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 14,
            audioStart: 262,
          },
        ],
      },
      title: "A Date",
      editor: {
        end_no: 15,
        start_no: 10,
        active_no: 11,
        block_start_no: 10,
      },
      illustrationUrl:
        "https://stories-cdn.duolingo.com/image/df24f7756b139f6eda927eb776621b9febe1a3f1.svg",
      trackingProperties: {},
      learningLanguageTitleContent: {
        text: "Een Afspraakje",
        audio: {
          url: "audio/56/badfe656.mp3",
          ssml: {
            id: 56,
            text: "<speak>Een Afspraakje</speak>",
            speaker: "nl-NL-FennaNeural(pitch=x-low)",
            plan_text: "Een Afspraakje",
            inser_index: 0,
            plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
          },
          keypoints: [
            {
              rangeEnd: 3,
              audioStart: 50,
            },
            {
              rangeEnd: 14,
              audioStart: 262,
            },
          ],
        },
        hints: ["A", "date"],
        hintMap: [
          {
            rangeTo: 2,
            hintIndex: 0,
            rangeFrom: 0,
          },
          {
            rangeTo: 13,
            hintIndex: 1,
            rangeFrom: 4,
          },
        ],
      },
    },
    {
      line: {
        type: "PROSE",
        content: {
          text: "Julia zit in een restaurant voor een afspraakje.",
          audio: {
            url: "audio/56/507cb990.mp3",
            ssml: {
              id: 56,
              text: "<speak>Julia zit in een restaurant voor een afspraakje.</speak>",
              speaker: "nl-NL-FennaNeural(pitch=x-low)",
              plan_text: "Julia zit~in een restaurant voor een afspraakje.",
              inser_index: 1,
              plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
            },
            keypoints: [
              {
                rangeEnd: 5,
                audioStart: 50,
              },
              {
                rangeEnd: 9,
                audioStart: 562,
              },
              {
                rangeEnd: 12,
                audioStart: 812,
              },
              {
                rangeEnd: 16,
                audioStart: 950,
              },
              {
                rangeEnd: 27,
                audioStart: 1037,
              },
              {
                rangeEnd: 32,
                audioStart: 1637,
              },
              {
                rangeEnd: 36,
                audioStart: 1812,
              },
              {
                rangeEnd: 47,
                audioStart: 1937,
              },
            ],
          },
          hints: ["is at", "a", "restaurant", "for", "a", "date"],
          hintMap: [
            {
              rangeTo: 11,
              hintIndex: 0,
              rangeFrom: 6,
            },
            {
              rangeTo: 15,
              hintIndex: 1,
              rangeFrom: 13,
            },
            {
              rangeTo: 26,
              hintIndex: 2,
              rangeFrom: 17,
            },
            {
              rangeTo: 31,
              hintIndex: 3,
              rangeFrom: 28,
            },
            {
              rangeTo: 35,
              hintIndex: 4,
              rangeFrom: 33,
            },
            {
              rangeTo: 46,
              hintIndex: 5,
              rangeFrom: 37,
            },
          ],
        },
      },
      type: "LINE",
      audio: {
        url: "audio/56/507cb990.mp3",
        ssml: {
          id: 56,
          text: "<speak>Julia zit in een restaurant voor een afspraakje.</speak>",
          speaker: "nl-NL-FennaNeural(pitch=x-low)",
          plan_text: "Julia zit~in een restaurant voor een afspraakje.",
          inser_index: 1,
          plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
        },
        keypoints: [
          {
            rangeEnd: 5,
            audioStart: 50,
          },
          {
            rangeEnd: 9,
            audioStart: 562,
          },
          {
            rangeEnd: 12,
            audioStart: 812,
          },
          {
            rangeEnd: 16,
            audioStart: 950,
          },
          {
            rangeEnd: 27,
            audioStart: 1037,
          },
          {
            rangeEnd: 32,
            audioStart: 1637,
          },
          {
            rangeEnd: 36,
            audioStart: 1812,
          },
          {
            rangeEnd: 47,
            audioStart: 1937,
          },
        ],
      },
      editor: {
        end_no: 20,
        start_no: 15,
        active_no: 16,
        block_start_no: 15,
      },
      trackingProperties: {
        line_index: 1,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Wat zou je willen eten?",
          audio: {
            url: "audio/56/ef375bfe.mp3",
            ssml: {
              id: 56,
              text: "<speak>Wat  zou je    willen eten?</speak>",
              speaker: "nl-NL-MaartenNeural(pitch=high)",
              plan_text: "Wat  zou~je    willen eten?",
              inser_index: 2,
              plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 3,
                audioStart: 50,
              },
              {
                rangeEnd: 7,
                audioStart: 262,
              },
              {
                rangeEnd: 10,
                audioStart: 462,
              },
              {
                rangeEnd: 17,
                audioStart: 575,
              },
              {
                rangeEnd: 22,
                audioStart: 825,
              },
            ],
          },
          hints: ["What", "would you", "like", "for dinner?"],
          hintMap: [
            {
              rangeTo: 2,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 9,
              hintIndex: 1,
              rangeFrom: 4,
            },
            {
              rangeTo: 16,
              hintIndex: 2,
              rangeFrom: 11,
            },
            {
              rangeTo: 21,
              hintIndex: 3,
              rangeFrom: 18,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
        characterId: 100,
      },
      type: "LINE",
      audio: {
        url: "audio/56/ef375bfe.mp3",
        ssml: {
          id: 56,
          text: "<speak>Wat  zou je    willen eten?</speak>",
          speaker: "nl-NL-MaartenNeural(pitch=high)",
          plan_text: "Wat  zou~je    willen eten?",
          inser_index: 2,
          plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 7,
            audioStart: 262,
          },
          {
            rangeEnd: 10,
            audioStart: 462,
          },
          {
            rangeEnd: 17,
            audioStart: 575,
          },
          {
            rangeEnd: 22,
            audioStart: 825,
          },
        ],
      },
      editor: {
        end_no: 25,
        start_no: 20,
        active_no: 21,
        block_start_no: 20,
      },
      trackingProperties: {
        line_index: 2,
      },
      hideRangesForChallenge: [],
    },
    {
      type: "MULTIPLE_CHOICE",
      editor: {
        end_no: 31,
        start_no: 25,
        active_no: 26,
        block_start_no: 25,
      },
      answers: [
        {
          text: "... what the food is.",
          hints: [],
          hintMap: [],
        },
        {
          text: "... what Julie wants to eat.",
          hints: [],
          hintMap: [],
        },
        {
          text: "... how much the food costs",
          hints: [],
          hintMap: [],
        },
      ],
      question: {
        text: "Paul wants to know ...",
        hints: [],
        hintMap: [],
      },
      correctAnswerIndex: 1,
      trackingProperties: {
        line_index: 2,
        challenge_type: "multiple-choice",
      },
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Een salade.",
          audio: {
            url: "audio/56/b4270222.mp3",
            ssml: {
              id: 56,
              text: "<speak>Een salade.</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Een salade.",
              inser_index: 3,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 3,
                audioStart: 50,
              },
              {
                rangeEnd: 10,
                audioStart: 287,
              },
            ],
          },
          hints: ["A", "salad"],
          hintMap: [
            {
              rangeTo: 2,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 9,
              hintIndex: 1,
              rangeFrom: 4,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/b4270222.mp3",
        ssml: {
          id: 56,
          text: "<speak>Een salade.</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Een salade.",
          inser_index: 3,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 10,
            audioStart: 287,
          },
        ],
      },
      editor: {
        end_no: 36,
        start_no: 31,
        active_no: 32,
        block_start_no: 31,
      },
      trackingProperties: {
        line_index: 3,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ik eet geen vlees.",
          audio: {
            url: "audio/56/b1703792.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ik eet geen vlees.</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Ik eet geen vlees.",
              inser_index: 4,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 6,
                audioStart: 312,
              },
              {
                rangeEnd: 11,
                audioStart: 512,
              },
              {
                rangeEnd: 17,
                audioStart: 812,
              },
            ],
          },
          hints: ["I", "eat", "no", "meat"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 3,
            },
            {
              rangeTo: 10,
              hintIndex: 2,
              rangeFrom: 7,
            },
            {
              rangeTo: 16,
              hintIndex: 3,
              rangeFrom: 12,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/b1703792.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ik eet geen vlees.</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Ik eet geen vlees.",
          inser_index: 4,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 6,
            audioStart: 312,
          },
          {
            rangeEnd: 11,
            audioStart: 512,
          },
          {
            rangeEnd: 17,
            audioStart: 812,
          },
        ],
      },
      editor: {
        end_no: 41,
        start_no: 36,
        active_no: 37,
        block_start_no: 36,
      },
      trackingProperties: {
        line_index: 4,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ben je vegetariër?",
          audio: {
            url: "audio/56/8e8f50e6.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ben je  vegetariër?</speak>",
              speaker: "nl-NL-MaartenNeural(pitch=high)",
              plan_text: "Ben je  vegetariër?",
              inser_index: 5,
              plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 3,
                audioStart: 50,
              },
              {
                rangeEnd: 6,
                audioStart: 225,
              },
              {
                rangeEnd: 17,
                audioStart: 325,
              },
            ],
          },
          hints: ["Are", "you", "a vegetarian"],
          hintMap: [
            {
              rangeTo: 2,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 4,
            },
            {
              rangeTo: 16,
              hintIndex: 2,
              rangeFrom: 7,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
        characterId: 100,
      },
      type: "LINE",
      audio: {
        url: "audio/56/8e8f50e6.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ben je  vegetariër?</speak>",
          speaker: "nl-NL-MaartenNeural(pitch=high)",
          plan_text: "Ben je  vegetariër?",
          inser_index: 5,
          plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 6,
            audioStart: 225,
          },
          {
            rangeEnd: 17,
            audioStart: 325,
          },
        ],
      },
      editor: {
        end_no: 46,
        start_no: 41,
        active_no: 42,
        block_start_no: 41,
      },
      trackingProperties: {
        line_index: 5,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ja.",
          audio: {
            url: "audio/56/afa9d058.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ja.</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Ja.",
              inser_index: 6,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
            ],
          },
          hints: ["Yes"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/afa9d058.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ja.</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Ja.",
          inser_index: 6,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
        ],
      },
      editor: {
        end_no: 51,
        start_no: 46,
        active_no: 47,
        block_start_no: 46,
      },
      trackingProperties: {
        line_index: 6,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ik ook!",
          audio: {
            url: "audio/56/943c340a.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ik ook!</speak>",
              speaker: "nl-NL-MaartenNeural(pitch=high)",
              plan_text: "Ik ook!",
              inser_index: 7,
              plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 6,
                audioStart: 262,
              },
            ],
          },
          hints: ["Me", "too"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 3,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
        characterId: 100,
      },
      type: "LINE",
      audio: {
        url: "audio/56/943c340a.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ik ook!</speak>",
          speaker: "nl-NL-MaartenNeural(pitch=high)",
          plan_text: "Ik ook!",
          inser_index: 7,
          plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 6,
            audioStart: 262,
          },
        ],
      },
      editor: {
        end_no: 56,
        start_no: 51,
        active_no: 52,
        block_start_no: 51,
      },
      trackingProperties: {
        line_index: 7,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Oh, leuk.",
          audio: {
            url: "audio/56/ab4ac5bc.mp3",
            ssml: {
              id: 56,
              text: "<speak>Oh, leuk.</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Oh, leuk.",
              inser_index: 8,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 7,
                audioStart: 587,
              },
            ],
          },
          hints: ["nice"],
          hintMap: [
            {
              rangeTo: 7,
              hintIndex: 0,
              rangeFrom: 4,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/ab4ac5bc.mp3",
        ssml: {
          id: 56,
          text: "<speak>Oh, leuk.</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Oh, leuk.",
          inser_index: 8,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 7,
            audioStart: 587,
          },
        ],
      },
      editor: {
        end_no: 61,
        start_no: 56,
        active_no: 57,
        block_start_no: 56,
      },
      trackingProperties: {
        line_index: 8,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ben je Nederlands?",
          audio: {
            url: "audio/56/a8684f4a.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ben je  Nederlands?</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Ben je  Nederlands?",
              inser_index: 9,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 3,
                audioStart: 50,
              },
              {
                rangeEnd: 6,
                audioStart: 325,
              },
              {
                rangeEnd: 17,
                audioStart: 400,
              },
            ],
          },
          hints: ["Are", "you", "Dutch"],
          hintMap: [
            {
              rangeTo: 2,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 4,
            },
            {
              rangeTo: 16,
              hintIndex: 2,
              rangeFrom: 7,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/a8684f4a.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ben je  Nederlands?</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Ben je  Nederlands?",
          inser_index: 9,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 6,
            audioStart: 325,
          },
          {
            rangeEnd: 17,
            audioStart: 400,
          },
        ],
      },
      editor: {
        end_no: 66,
        start_no: 61,
        active_no: 62,
        block_start_no: 61,
      },
      trackingProperties: {
        line_index: 9,
      },
      hideRangesForChallenge: [],
    },
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
        line_index: 10,
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
        line_index: 10,
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
        line_index: 10,
        challenge_type: "arrange",
      },
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Mijn vader is Canadees en mijn moeder Spaans.",
          audio: {
            url: "audio/56/994bea58.mp3",
            ssml: {
              id: 56,
              text: "<speak>Mijn vader  is Canadees en  mijn moeder Spaans.</speak>",
              speaker: "nl-NL-MaartenNeural(pitch=high)",
              plan_text: "Mijn vader  is Canadees en  mijn moeder Spaans.",
              inser_index: 11,
              plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 4,
                audioStart: 50,
              },
              {
                rangeEnd: 10,
                audioStart: 300,
              },
              {
                rangeEnd: 13,
                audioStart: 737,
              },
              {
                rangeEnd: 22,
                audioStart: 912,
              },
              {
                rangeEnd: 25,
                audioStart: 1562,
              },
              {
                rangeEnd: 30,
                audioStart: 1712,
              },
              {
                rangeEnd: 37,
                audioStart: 1925,
              },
              {
                rangeEnd: 44,
                audioStart: 2200,
              },
            ],
          },
          hints: [
            "My",
            "father",
            "is",
            "Canadian",
            "and",
            "my",
            "mother",
            "Spanish",
          ],
          hintMap: [
            {
              rangeTo: 3,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 9,
              hintIndex: 1,
              rangeFrom: 5,
            },
            {
              rangeTo: 12,
              hintIndex: 2,
              rangeFrom: 11,
            },
            {
              rangeTo: 21,
              hintIndex: 3,
              rangeFrom: 14,
            },
            {
              rangeTo: 24,
              hintIndex: 4,
              rangeFrom: 23,
            },
            {
              rangeTo: 29,
              hintIndex: 5,
              rangeFrom: 26,
            },
            {
              rangeTo: 36,
              hintIndex: 6,
              rangeFrom: 31,
            },
            {
              rangeTo: 43,
              hintIndex: 7,
              rangeFrom: 38,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
        characterId: 100,
      },
      type: "LINE",
      audio: {
        url: "audio/56/994bea58.mp3",
        ssml: {
          id: 56,
          text: "<speak>Mijn vader  is Canadees en  mijn moeder Spaans.</speak>",
          speaker: "nl-NL-MaartenNeural(pitch=high)",
          plan_text: "Mijn vader  is Canadees en  mijn moeder Spaans.",
          inser_index: 11,
          plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 4,
            audioStart: 50,
          },
          {
            rangeEnd: 10,
            audioStart: 300,
          },
          {
            rangeEnd: 13,
            audioStart: 737,
          },
          {
            rangeEnd: 22,
            audioStart: 912,
          },
          {
            rangeEnd: 25,
            audioStart: 1562,
          },
          {
            rangeEnd: 30,
            audioStart: 1712,
          },
          {
            rangeEnd: 37,
            audioStart: 1925,
          },
          {
            rangeEnd: 44,
            audioStart: 2200,
          },
        ],
      },
      editor: {
        end_no: 77,
        start_no: 72,
        active_no: 73,
        block_start_no: 72,
      },
      trackingProperties: {
        line_index: 11,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ik ben Canadees!",
          audio: {
            url: "audio/56/9f96a0ba.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ik ben Canadees!</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Ik ben Canadees!",
              inser_index: 12,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 6,
                audioStart: 287,
              },
              {
                rangeEnd: 15,
                audioStart: 500,
              },
            ],
          },
          hints: ["I", "am", "Canadian"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 3,
            },
            {
              rangeTo: 14,
              hintIndex: 2,
              rangeFrom: 7,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/9f96a0ba.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ik ben Canadees!</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Ik ben Canadees!",
          inser_index: 12,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 6,
            audioStart: 287,
          },
          {
            rangeEnd: 15,
            audioStart: 500,
          },
        ],
      },
      editor: {
        end_no: 82,
        start_no: 77,
        active_no: 78,
        block_start_no: 77,
      },
      trackingProperties: {
        line_index: 12,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ik houd van Canada!",
          audio: {
            url: "audio/56/d846568a.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ik houd van Canada!</speak>",
              speaker: "nl-NL-MaartenNeural(pitch=high)",
              plan_text: "Ik houd~van Canada!",
              inser_index: 13,
              plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 7,
                audioStart: 250,
              },
              {
                rangeEnd: 11,
                audioStart: 512,
              },
              {
                rangeEnd: 18,
                audioStart: 700,
              },
            ],
          },
          hints: ["I", "love", "Canada"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 10,
              hintIndex: 1,
              rangeFrom: 3,
            },
            {
              rangeTo: 17,
              hintIndex: 2,
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
        url: "audio/56/d846568a.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ik houd van Canada!</speak>",
          speaker: "nl-NL-MaartenNeural(pitch=high)",
          plan_text: "Ik houd~van Canada!",
          inser_index: 13,
          plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 7,
            audioStart: 250,
          },
          {
            rangeEnd: 11,
            audioStart: 512,
          },
          {
            rangeEnd: 18,
            audioStart: 700,
          },
        ],
      },
      editor: {
        end_no: 87,
        start_no: 82,
        active_no: 83,
        block_start_no: 82,
      },
      trackingProperties: {
        line_index: 13,
      },
      hideRangesForChallenge: [],
    },
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
        line_index: 14,
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
        line_index: 14,
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
        line_index: 14,
        challenge_type: "select-phrases",
      },
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ja, ik heb drie katten en een hond.",
          audio: {
            url: "audio/56/e1748498.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ja,  ik heb  drie  katten en  een hond.</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Ja,  ik heb  drie  katten en  een hond.",
              inser_index: 15,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 5,
                audioStart: 762,
              },
              {
                rangeEnd: 9,
                audioStart: 912,
              },
              {
                rangeEnd: 14,
                audioStart: 1125,
              },
              {
                rangeEnd: 21,
                audioStart: 1387,
              },
              {
                rangeEnd: 24,
                audioStart: 1737,
              },
              {
                rangeEnd: 28,
                audioStart: 1850,
              },
              {
                rangeEnd: 33,
                audioStart: 1975,
              },
            ],
          },
          hints: ["Yes", "I", "have", "three", "cats", "and", "a", "dog"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 4,
            },
            {
              rangeTo: 9,
              hintIndex: 2,
              rangeFrom: 7,
            },
            {
              rangeTo: 14,
              hintIndex: 3,
              rangeFrom: 11,
            },
            {
              rangeTo: 21,
              hintIndex: 4,
              rangeFrom: 16,
            },
            {
              rangeTo: 24,
              hintIndex: 5,
              rangeFrom: 23,
            },
            {
              rangeTo: 28,
              hintIndex: 6,
              rangeFrom: 26,
            },
            {
              rangeTo: 33,
              hintIndex: 7,
              rangeFrom: 30,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/e1748498.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ja,  ik heb  drie  katten en  een hond.</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Ja,  ik heb  drie  katten en  een hond.",
          inser_index: 15,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 5,
            audioStart: 762,
          },
          {
            rangeEnd: 9,
            audioStart: 912,
          },
          {
            rangeEnd: 14,
            audioStart: 1125,
          },
          {
            rangeEnd: 21,
            audioStart: 1387,
          },
          {
            rangeEnd: 24,
            audioStart: 1737,
          },
          {
            rangeEnd: 28,
            audioStart: 1850,
          },
          {
            rangeEnd: 33,
            audioStart: 1975,
          },
        ],
      },
      editor: {
        end_no: 101,
        start_no: 96,
        active_no: 97,
        block_start_no: 96,
      },
      trackingProperties: {
        line_index: 15,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Ik heb ook katten en een hond, Anne!",
          audio: {
            url: "audio/56/e5030206.mp3",
            ssml: {
              id: 56,
              text: "<speak>Ik heb  ook  katten en  een hond, Anne!</speak>",
              speaker: "nl-NL-MaartenNeural(pitch=high)",
              plan_text: "Ik heb  ook  katten en  een hond, Anne!",
              inser_index: 16,
              plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 6,
                audioStart: 250,
              },
              {
                rangeEnd: 10,
                audioStart: 462,
              },
              {
                rangeEnd: 17,
                audioStart: 662,
              },
              {
                rangeEnd: 20,
                audioStart: 1037,
              },
              {
                rangeEnd: 24,
                audioStart: 1187,
              },
              {
                rangeEnd: 29,
                audioStart: 1312,
              },
              {
                rangeEnd: 34,
                audioStart: 1875,
              },
            ],
          },
          hints: ["I", "have", "also", "cats", "and", "a", "dog"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 3,
            },
            {
              rangeTo: 9,
              hintIndex: 2,
              rangeFrom: 7,
            },
            {
              rangeTo: 16,
              hintIndex: 3,
              rangeFrom: 11,
            },
            {
              rangeTo: 19,
              hintIndex: 4,
              rangeFrom: 18,
            },
            {
              rangeTo: 23,
              hintIndex: 5,
              rangeFrom: 21,
            },
            {
              rangeTo: 28,
              hintIndex: 6,
              rangeFrom: 25,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
        characterId: 100,
      },
      type: "LINE",
      audio: {
        url: "audio/56/e5030206.mp3",
        ssml: {
          id: 56,
          text: "<speak>Ik heb  ook  katten en  een hond, Anne!</speak>",
          speaker: "nl-NL-MaartenNeural(pitch=high)",
          plan_text: "Ik heb  ook  katten en  een hond, Anne!",
          inser_index: 16,
          plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 6,
            audioStart: 250,
          },
          {
            rangeEnd: 10,
            audioStart: 462,
          },
          {
            rangeEnd: 17,
            audioStart: 662,
          },
          {
            rangeEnd: 20,
            audioStart: 1037,
          },
          {
            rangeEnd: 24,
            audioStart: 1187,
          },
          {
            rangeEnd: 29,
            audioStart: 1312,
          },
          {
            rangeEnd: 34,
            audioStart: 1875,
          },
        ],
      },
      editor: {
        end_no: 106,
        start_no: 101,
        active_no: 102,
        block_start_no: 101,
      },
      trackingProperties: {
        line_index: 16,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "PROSE",
        content: {
          text: "Julia kijkt verrast naar Paul.",
          audio: {
            url: "audio/56/18e9471e.mp3",
            ssml: {
              id: 56,
              text: "<speak>Julia kijkt verrast   naar Paul.</speak>",
              speaker: "nl-NL-FennaNeural(pitch=x-low)",
              plan_text: "Julia kijkt verrast   naar Paul.",
              inser_index: 17,
              plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
            },
            keypoints: [
              {
                rangeEnd: 5,
                audioStart: 50,
              },
              {
                rangeEnd: 11,
                audioStart: 525,
              },
              {
                rangeEnd: 19,
                audioStart: 850,
              },
              {
                rangeEnd: 24,
                audioStart: 1300,
              },
              {
                rangeEnd: 29,
                audioStart: 1462,
              },
            ],
          },
          hints: ["looks", "surprised", "to"],
          hintMap: [
            {
              rangeTo: 10,
              hintIndex: 0,
              rangeFrom: 6,
            },
            {
              rangeTo: 18,
              hintIndex: 1,
              rangeFrom: 12,
            },
            {
              rangeTo: 23,
              hintIndex: 2,
              rangeFrom: 20,
            },
          ],
        },
      },
      type: "LINE",
      audio: {
        url: "audio/56/18e9471e.mp3",
        ssml: {
          id: 56,
          text: "<speak>Julia kijkt verrast   naar Paul.</speak>",
          speaker: "nl-NL-FennaNeural(pitch=x-low)",
          plan_text: "Julia kijkt verrast   naar Paul.",
          inser_index: 17,
          plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
        },
        keypoints: [
          {
            rangeEnd: 5,
            audioStart: 50,
          },
          {
            rangeEnd: 11,
            audioStart: 525,
          },
          {
            rangeEnd: 19,
            audioStart: 850,
          },
          {
            rangeEnd: 24,
            audioStart: 1300,
          },
          {
            rangeEnd: 29,
            audioStart: 1462,
          },
        ],
      },
      editor: {
        end_no: 111,
        start_no: 106,
        active_no: 107,
        block_start_no: 106,
      },
      trackingProperties: {
        line_index: 17,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Anne? Maar ik heet Julia !",
          audio: {
            url: "audio/56/30c86932.mp3",
            ssml: {
              id: 56,
              text: "<speak>Anne? Maar ik heet      Julia !</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "Anne? Maar ik heet      Julia !",
              inser_index: 18,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 4,
                audioStart: 50,
              },
              {
                rangeEnd: 9,
                audioStart: 1287,
              },
              {
                rangeEnd: 12,
                audioStart: 1550,
              },
              {
                rangeEnd: 17,
                audioStart: 1675,
              },
              {
                rangeEnd: 23,
                audioStart: 1950,
              },
            ],
          },
          hints: ["But", "I", "am called"],
          hintMap: [
            {
              rangeTo: 9,
              hintIndex: 0,
              rangeFrom: 6,
            },
            {
              rangeTo: 12,
              hintIndex: 1,
              rangeFrom: 11,
            },
            {
              rangeTo: 17,
              hintIndex: 2,
              rangeFrom: 14,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/30c86932.mp3",
        ssml: {
          id: 56,
          text: "<speak>Anne? Maar ik heet      Julia !</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "Anne? Maar ik heet      Julia !",
          inser_index: 18,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 4,
            audioStart: 50,
          },
          {
            rangeEnd: 9,
            audioStart: 1287,
          },
          {
            rangeEnd: 12,
            audioStart: 1550,
          },
          {
            rangeEnd: 17,
            audioStart: 1675,
          },
          {
            rangeEnd: 23,
            audioStart: 1950,
          },
        ],
      },
      editor: {
        end_no: 116,
        start_no: 111,
        active_no: 112,
        block_start_no: 111,
      },
      trackingProperties: {
        line_index: 18,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "En jij bent Sebastiaan toch?",
          audio: {
            url: "audio/56/7cd97f28.mp3",
            ssml: {
              id: 56,
              text: "<speak>En  jij bent       Sebastiaan toch?</speak>",
              speaker: "nl-BE-DenaNeural(pitch=high)",
              plan_text: "En  jij bent       Sebastiaan toch?",
              inser_index: 19,
              plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 2,
                audioStart: 50,
              },
              {
                rangeEnd: 6,
                audioStart: 312,
              },
              {
                rangeEnd: 11,
                audioStart: 562,
              },
              {
                rangeEnd: 22,
                audioStart: 812,
              },
              {
                rangeEnd: 27,
                audioStart: 1562,
              },
            ],
          },
          hints: ["And", "you", "are", "right"],
          hintMap: [
            {
              rangeTo: 1,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 5,
              hintIndex: 1,
              rangeFrom: 3,
            },
            {
              rangeTo: 10,
              hintIndex: 2,
              rangeFrom: 7,
            },
            {
              rangeTo: 26,
              hintIndex: 3,
              rangeFrom: 23,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/fd9c603a82713d7dfd7a2086f2830d6496ecb53a.svg",
        characterId: 336,
      },
      type: "LINE",
      audio: {
        url: "audio/56/7cd97f28.mp3",
        ssml: {
          id: 56,
          text: "<speak>En  jij bent       Sebastiaan toch?</speak>",
          speaker: "nl-BE-DenaNeural(pitch=high)",
          plan_text: "En  jij bent       Sebastiaan toch?",
          inser_index: 19,
          plan_text_speaker_name: "nl-BE-DenaNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 2,
            audioStart: 50,
          },
          {
            rangeEnd: 6,
            audioStart: 312,
          },
          {
            rangeEnd: 11,
            audioStart: 562,
          },
          {
            rangeEnd: 22,
            audioStart: 812,
          },
          {
            rangeEnd: 27,
            audioStart: 1562,
          },
        ],
      },
      editor: {
        end_no: 121,
        start_no: 116,
        active_no: 117,
        block_start_no: 116,
      },
      trackingProperties: {
        line_index: 19,
      },
      hideRangesForChallenge: [],
    },
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
        line_index: 20,
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
        line_index: 20,
        challenge_type: "multiple-choice",
      },
    },
    {
      line: {
        type: "PROSE",
        content: {
          text: "Een vrouw komt het restaurant binnen.",
          audio: {
            url: "audio/56/88899a24.mp3",
            ssml: {
              id: 56,
              text: "<speak>Een vrouw komt   het restaurant binnen.</speak>",
              speaker: "nl-NL-FennaNeural(pitch=x-low)",
              plan_text: "Een vrouw komt   het restaurant binnen.",
              inser_index: 21,
              plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
            },
            keypoints: [
              {
                rangeEnd: 3,
                audioStart: 50,
              },
              {
                rangeEnd: 9,
                audioStart: 225,
              },
              {
                rangeEnd: 14,
                audioStart: 600,
              },
              {
                rangeEnd: 18,
                audioStart: 825,
              },
              {
                rangeEnd: 29,
                audioStart: 937,
              },
              {
                rangeEnd: 36,
                audioStart: 1575,
              },
            ],
          },
          hints: [
            "A",
            "woman",
            "enters",
            "the",
            "restaurant",
            "(komt binnen=enters)",
          ],
          hintMap: [
            {
              rangeTo: 2,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 8,
              hintIndex: 1,
              rangeFrom: 4,
            },
            {
              rangeTo: 13,
              hintIndex: 2,
              rangeFrom: 10,
            },
            {
              rangeTo: 17,
              hintIndex: 3,
              rangeFrom: 15,
            },
            {
              rangeTo: 28,
              hintIndex: 4,
              rangeFrom: 19,
            },
            {
              rangeTo: 35,
              hintIndex: 5,
              rangeFrom: 30,
            },
          ],
        },
      },
      type: "LINE",
      audio: {
        url: "audio/56/88899a24.mp3",
        ssml: {
          id: 56,
          text: "<speak>Een vrouw komt   het restaurant binnen.</speak>",
          speaker: "nl-NL-FennaNeural(pitch=x-low)",
          plan_text: "Een vrouw komt   het restaurant binnen.",
          inser_index: 21,
          plan_text_speaker_name: "nl-NL-FennaNeural(pitch=x-low)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 9,
            audioStart: 225,
          },
          {
            rangeEnd: 14,
            audioStart: 600,
          },
          {
            rangeEnd: 18,
            audioStart: 825,
          },
          {
            rangeEnd: 29,
            audioStart: 937,
          },
          {
            rangeEnd: 36,
            audioStart: 1575,
          },
        ],
      },
      editor: {
        end_no: 136,
        start_no: 131,
        active_no: 132,
        block_start_no: 131,
      },
      trackingProperties: {
        line_index: 21,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Hoi! Ben jij Paul? Ik ben Anne.",
          audio: {
            url: "audio/56/06a4ba58.mp3",
            ssml: {
              id: 56,
              text: "<speak>Hoi! Ben jij Paul? Ik ben Anne.</speak>",
              speaker: "nl-NL-FennaNeural(pitch=low)",
              plan_text: "Hoi! Ben jij Paul? Ik ben Anne.",
              inser_index: 22,
              plan_text_speaker_name: "nl-NL-FennaNeural(pitch=low)",
            },
            keypoints: [
              {
                rangeEnd: 3,
                audioStart: 50,
              },
              {
                rangeEnd: 7,
                audioStart: 1400,
              },
              {
                rangeEnd: 11,
                audioStart: 1650,
              },
              {
                rangeEnd: 16,
                audioStart: 1800,
              },
              {
                rangeEnd: 19,
                audioStart: 3112,
              },
              {
                rangeEnd: 23,
                audioStart: 3287,
              },
              {
                rangeEnd: 28,
                audioStart: 3512,
              },
            ],
          },
          hints: ["Hi", "Are", "you", "I", "am"],
          hintMap: [
            {
              rangeTo: 2,
              hintIndex: 0,
              rangeFrom: 0,
            },
            {
              rangeTo: 7,
              hintIndex: 1,
              rangeFrom: 5,
            },
            {
              rangeTo: 11,
              hintIndex: 2,
              rangeFrom: 9,
            },
            {
              rangeTo: 20,
              hintIndex: 3,
              rangeFrom: 19,
            },
            {
              rangeTo: 24,
              hintIndex: 4,
              rangeFrom: 22,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/27d9035afe381e7c5ae6d21dd2a456ae7a576b14.svg",
        characterId: 101,
      },
      type: "LINE",
      audio: {
        url: "audio/56/06a4ba58.mp3",
        ssml: {
          id: 56,
          text: "<speak>Hoi! Ben jij Paul? Ik ben Anne.</speak>",
          speaker: "nl-NL-FennaNeural(pitch=low)",
          plan_text: "Hoi! Ben jij Paul? Ik ben Anne.",
          inser_index: 22,
          plan_text_speaker_name: "nl-NL-FennaNeural(pitch=low)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 7,
            audioStart: 1400,
          },
          {
            rangeEnd: 11,
            audioStart: 1650,
          },
          {
            rangeEnd: 16,
            audioStart: 1800,
          },
          {
            rangeEnd: 19,
            audioStart: 3112,
          },
          {
            rangeEnd: 23,
            audioStart: 3287,
          },
          {
            rangeEnd: 28,
            audioStart: 3512,
          },
        ],
      },
      editor: {
        end_no: 141,
        start_no: 136,
        active_no: 137,
        block_start_no: 136,
      },
      trackingProperties: {
        line_index: 22,
      },
      hideRangesForChallenge: [],
    },
    {
      line: {
        type: "CHARACTER",
        content: {
          text: "Euh, nee. Ik ben Sebastiaan.",
          audio: {
            url: "audio/56/0d46a074.mp3",
            ssml: {
              id: 56,
              text: "<speak>Euh, nee. Ik ben Sebastiaan.</speak>",
              speaker: "nl-NL-MaartenNeural(pitch=high)",
              plan_text: "Euh, nee. Ik ben Sebastiaan.",
              inser_index: 23,
              plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
            },
            keypoints: [
              {
                rangeEnd: 3,
                audioStart: 50,
              },
              {
                rangeEnd: 7,
                audioStart: 687,
              },
              {
                rangeEnd: 10,
                audioStart: 1512,
              },
              {
                rangeEnd: 14,
                audioStart: 1725,
              },
              {
                rangeEnd: 25,
                audioStart: 1925,
              },
            ],
          },
          hints: ["no", "I", "am"],
          hintMap: [
            {
              rangeTo: 7,
              hintIndex: 0,
              rangeFrom: 5,
            },
            {
              rangeTo: 11,
              hintIndex: 1,
              rangeFrom: 10,
            },
            {
              rangeTo: 15,
              hintIndex: 2,
              rangeFrom: 13,
            },
          ],
        },
        avatarUrl:
          "https://stories-cdn.duolingo.com/image/9ed7124d96bbf015b7b8d9c62ddd6abba98d29c4.svg",
        characterId: 100,
      },
      type: "LINE",
      audio: {
        url: "audio/56/0d46a074.mp3",
        ssml: {
          id: 56,
          text: "<speak>Euh, nee. Ik ben Sebastiaan.</speak>",
          speaker: "nl-NL-MaartenNeural(pitch=high)",
          plan_text: "Euh, nee. Ik ben Sebastiaan.",
          inser_index: 23,
          plan_text_speaker_name: "nl-NL-MaartenNeural(pitch=high)",
        },
        keypoints: [
          {
            rangeEnd: 3,
            audioStart: 50,
          },
          {
            rangeEnd: 7,
            audioStart: 687,
          },
          {
            rangeEnd: 10,
            audioStart: 1512,
          },
          {
            rangeEnd: 14,
            audioStart: 1725,
          },
          {
            rangeEnd: 25,
            audioStart: 1925,
          },
        ],
      },
      editor: {
        end_no: 146,
        start_no: 141,
        active_no: 142,
        block_start_no: 141,
      },
      trackingProperties: {
        line_index: 23,
      },
      hideRangesForChallenge: [],
    },
    {
      type: "MULTIPLE_CHOICE",
      editor: {
        end_no: 152,
        start_no: 146,
        active_no: 147,
        block_start_no: 146,
      },
      answers: [
        {
          text: "... is moe van het praten met Julia.",
          hints: [],
          hintMap: [],
        },
        {
          text: "... heet eigenlijk Sebastiaan.",
          hints: [],
          hintMap: [],
        },
        {
          text: "... liegt tegen Anne omdat hij Julia leuk vindt.",
          hints: [],
          hintMap: [],
        },
      ],
      question: {
        text: "Paul...",
        hints: [],
        hintMap: [],
      },
      correctAnswerIndex: 2,
      trackingProperties: {
        line_index: 23,
        challenge_type: "multiple-choice",
      },
    },
    {
      type: "MATCH",
      editor: {
        end_no: 161,
        start_no: 152,
        active_no: 153,
        block_start_no: 152,
      },
      prompt: "Tap the pairs",
      fallbackHints: [
        {
          phrase: "to be called",
          translation: "heten",
        },
        {
          phrase: "the vegetarian",
          translation: "de vegetariër",
        },
        {
          phrase: "the meat",
          translation: "het vlees",
        },
        {
          phrase: "the pet",
          translation: "het huisdier",
        },
        {
          phrase: "the woman",
          translation: "de vrouw",
        },
      ],
      trackingProperties: {
        line_index: 24,
        challenge_type: "match",
      },
    },
  ],
  illustrations: {
    active:
      "https://stories-cdn.duolingo.com/image/df24f7756b139f6eda927eb776621b9febe1a3f1.svg",
    gilded:
      "https://stories-cdn.duolingo.com/image/8f5de62e27e14a3e766d60caa1dfbca5a12e6480.svg",
    locked:
      "https://stories-cdn.duolingo.com/image/840c68f130c57fb276085e99fd394517c07f0b68.svg",
  },
  fromLanguageRTL: 0,
  fromLanguageName: "A Date",
  learningLanguageRTL: 0,
  id: 56,
  course_id: 2,
  from_language: "en",
  from_language_id: 1,
  from_language_long: "English",
  from_language_rtl: false,
  from_language_name: "A Date",
  learning_language: "nl",
  learning_language_long: "Dutch",
  learning_language_rtl: false,
};

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
      line_index: 10,
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
      line_index: 10,
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
      line_index: 10,
      challenge_type: "arrange",
    },
  },
];

export const Normal = {
  render: (args) => <StoryPart elements={parts} {...args}></StoryPart>,
};
