import StoryQuestionPrompt from "./StoryQuestionPrompt";

const meta = {
  component: StoryQuestionPrompt,
  argTypes: {},
};

export default meta;

export const Normal = {
  render: () => (
    <StoryQuestionPrompt question={"Is this a question?"}></StoryQuestionPrompt>
  ),
};
