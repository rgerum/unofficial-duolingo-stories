import PlayAudio from "./PlayAudio";

const meta = {
  component: PlayAudio,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <PlayAudio {...args}>
    </PlayAudio>
  ),
};
