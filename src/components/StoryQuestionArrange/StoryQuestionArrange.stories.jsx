import StoryQuestionArrange from "./StoryQuestionArrange";

const meta = {
  component: StoryQuestionArrange,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: (args) => (
    <StoryQuestionArrange
      element={{
        phraseOrder: [1, 2, 3, 0],
        selectablePhrases: ["is", "a", "test", "this"],
      }}
      {...args}
    ></StoryQuestionArrange>
  ),
};
