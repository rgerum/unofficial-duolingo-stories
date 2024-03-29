import StoryQuestionSelectPhrase from "./StoryQuestionSelectPhrase";

const meta = {
  component: StoryQuestionSelectPhrase,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: (args) => (
    <StoryQuestionSelectPhrase
      element={{
        answers: [
          { text: "Option A" },
          { text: "Option B" },
          { text: "Option C" },
        ],
        correctAnswerIndex: 2,
      }}
      {...args}
    ></StoryQuestionSelectPhrase>
  ),
};
