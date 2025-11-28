import StoryFooter from "./StoryFooter";

const meta = {
  component: StoryFooter,
  argTypes: {
    buttonStatus: {
      control: "radio",
      options: ["idle", "right", "wait"],
    },
  },
};

export default meta;

export const Normal = {
  render: (args) => <StoryFooter {...args}></StoryFooter>,
};
