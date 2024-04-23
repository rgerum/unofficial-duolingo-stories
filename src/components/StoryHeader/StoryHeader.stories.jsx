import StoryHeader from "./StoryHeader";
import StoryProgress from "../StoryProgress";

const meta = {
  component: StoryHeader,
  argTypes: {},
};

export default meta;

const parts = [
  {
    lang: "nl",
    type: "HEADER",
    audio: {
      ssml: {
        id: 0,
        text: "<speak>This is the Title</speak>",
        mapping: [
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          16,
          16,
        ],
        speaker: "",
        plan_text: "This is the Title",
        inser_index: 0,
      },
    },
    editor: {
      end_no: 13,
      start_no: 8,
      active_no: 9,
      block_start_no: 8,
    },
    illustrationUrl:
      "https://stories-cdn.duolingo.com/image/783305780a6dad8e0e4eb34109d948e6a5fc2c35.svg",
    trackingProperties: {},
    learningLanguageTitleContent: {
      text: "This is the Title",
      audio: {
        ssml: {
          id: 0,
          text: "<speak>This is the Title</speak>",
          mapping: [
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            0,
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            16,
            16,
            16,
            16,
            16,
            16,
            16,
            16,
          ],
          speaker: "",
          plan_text: "This is the Title",
          inser_index: 0,
        },
      },
      hints: ["Thes", "is", "the", "Title"],
      hintMap: [
        {
          rangeTo: 3,
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
          rangeTo: 16,
          hintIndex: 3,
          rangeFrom: 12,
        },
      ],
      lang_hints: "en",
    },
  },
];

export const Normal = {
  render: (args) => (
    <StoryProgress parts_list={[parts]} {...args}></StoryProgress>
  ),
};
