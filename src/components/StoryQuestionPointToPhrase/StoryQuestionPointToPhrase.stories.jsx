import StoryQuestionPointToPhrase from "./StoryQuestionPointToPhrase";

const meta = {
  component: StoryQuestionPointToPhrase,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: (args) => (
    <StoryQuestionPointToPhrase
      element={{
        question: "Which word is the negation?",
        correctAnswerIndex: 1,
        transcriptParts: [
          { text: "I", selectable: true },
          { text: "am", selectable: false },
          { text: "not", selectable: true },
          { text: "the", selectable: false },
          { text: "great", selectable: true },
          { text: "result", selectable: true },
          { text: ".", selectable: false },
        ],
      }}
      {...args}
    ></StoryQuestionPointToPhrase>
  ),
};
