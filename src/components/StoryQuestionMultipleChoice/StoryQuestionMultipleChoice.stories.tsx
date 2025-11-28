import StoryQuestionMultipleChoice from "./StoryQuestionMultipleChoice";

const meta = {
  component: StoryQuestionMultipleChoice,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryQuestionMultipleChoice
      active={true}
      advance={() => console.log('advance')}
      element={{
        question: "What is the right answer?",
        answers: [
          "option A",
          "option B",
          "option C"
        ],
        correctAnswerIndex: 1,
        lang: "en",
        trackingProperties: { line_index: 0 },
      }}
    />
  ),
};
