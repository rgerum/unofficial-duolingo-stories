import StoryQuestionArrange from "./StoryQuestionArrange";

const meta = {
  component: StoryQuestionArrange,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryQuestionArrange
      element={{
        characterPositions: [0, 1, 2, 3],
        phraseOrder: [1, 2, 3, 0],
        selectablePhrases: ["is", "a", "test", "this"],
      }}
      active={true}
      advance={() => {}}
    ></StoryQuestionArrange>
  ),
};
