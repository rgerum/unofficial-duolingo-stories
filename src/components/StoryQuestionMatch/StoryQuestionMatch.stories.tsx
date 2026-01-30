import StoryQuestionMatch from "./StoryQuestionMatch";

const meta = {
  component: StoryQuestionMatch,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryQuestionMatch
      element={{
        type: "MATCH",
        prompt: "Select the pairs.",
        fallbackHints: [
          { phrase: "a", translation: "A" },
          { phrase: "b", translation: "B" },
          { phrase: "c", translation: "C" },
          { phrase: "d", translation: "D" },
          { phrase: "e", translation: "E" },
        ],
        trackingProperties: {
          line_index: 0,
          challenge_type: "match",
        },
        lang: "en",
        lang_question: "en",
        editor: {},
      }}
      setDone={() => {}}
    ></StoryQuestionMatch>
  ),
};
