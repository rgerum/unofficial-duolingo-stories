import WordButton from "./WordButton";

const meta = {
  component: WordButton,
  argTypes: {
    status: {
      control: "radio",
      options: [
        "default",
        "right",
        "wrong",
        "off",
        "selected",
        "false",
        "done",
        "right-stay",
      ],
    },
  },
};

export default meta;

export const Normal = {
  render: (args) => <WordButton {...args}>Test</WordButton>,
};
