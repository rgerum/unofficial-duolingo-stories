import StoryQuestionMultipleChoice from "./StoryQuestionMultipleChoice";

const meta = {
  component: StoryQuestionMultipleChoice,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: (args) => (
    <StoryQuestionMultipleChoice
      {...args}
      setUnhide={true}
      progress={100}
      element={{
        question: "What is the right answer?",
        answers: [
          { text: "option A", hintMap: [] },
          { text: "option B", hintMap: [] },
          { text: "option C", hintMap: [] },
        ],
        correctAnswerIndex: 1,
        lang: "en",
        trackingProperties: { line_index: 0 },
      }}
    ></StoryQuestionMultipleChoice>
  ),
};
