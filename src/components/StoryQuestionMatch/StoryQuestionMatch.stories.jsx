import StoryQuestionMatch from "./StoryQuestionMatch";

const meta = {
  component: StoryQuestionMatch,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: (args) => (
    <StoryQuestionMatch
      element={{
        fallbackHints: [
          { phrase: "a", translation: "A" },
          { phrase: "b", translation: "B" },
          { phrase: "c", translation: "C" },
          { phrase: "d", translation: "D" },
          { phrase: "e", translation: "E" },
        ],
      }}
      {...args}
    ></StoryQuestionMatch>
  ),
};
