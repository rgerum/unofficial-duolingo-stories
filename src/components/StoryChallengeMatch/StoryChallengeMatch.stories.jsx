import StoryChallengeMatch from "./StoryChallengeMatch";

const meta = {
  component: StoryChallengeMatch,
  argTypes: {},
};

export default meta;

const parts = [
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
];

export const Normal = {
  render: (args) => (
    <StoryChallengeMatch parts={parts} {...args}></StoryChallengeMatch>
  ),
};
