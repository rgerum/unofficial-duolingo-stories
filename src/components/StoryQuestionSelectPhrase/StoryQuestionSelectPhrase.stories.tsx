import StoryQuestionSelectPhrase from "./StoryQuestionSelectPhrase";

const meta = {
  component: StoryQuestionSelectPhrase,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryQuestionSelectPhrase
      element={{
        type: "SELECT_PHRASE",
        answers: ["Option A", "Option B", "Option C"],
        correctAnswerIndex: 2,
        trackingProperties: {
          line_index: 0,
          challenge_type: "select-phrases"
        },
        lang: "es",
        editor: {
          start_no: 0,
          end_no: 0
        }
      }}
      active={true}
      advance={() => {}}
    ></StoryQuestionSelectPhrase>
  ),
};
