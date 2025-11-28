import StoryQuestionPointToPhrase from "./StoryQuestionPointToPhrase";

const meta = {
  component: StoryQuestionPointToPhrase,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryQuestionPointToPhrase
      element={{
        type: "POINT_TO_PHRASE",
        question: {
          text: "Which word is the negation?",
          lang: "en",
          hintMap: [],
          hints: [],
          audio: undefined,
          lang_hints: undefined,
        },
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
        trackingProperties: {
          line_index: 0,
          challenge_type: "point-to-phrase",
        },
        lang_question: "en",
        lang: "en",
        editor: {
          start_no: 0,
          end_no: 0,
        },
      }}
      active={true}
      advance={() => {}}
    />
  ),
};
