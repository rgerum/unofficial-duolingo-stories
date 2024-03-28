import WordButton from "./WordButton";

const meta = {
  component: WordButton,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <WordButton {...args}>
    </WordButton>
  ),
};
