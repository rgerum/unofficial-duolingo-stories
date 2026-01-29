import CheckButton from "./CheckButton";

const meta = {
  component: CheckButton,
  argTypes: {
    type: { control: "radio", options: ["default", "right", "false", "done"] },
  },
};

export default meta;

export const Normal = {
  render: (args: { type: string }) => <CheckButton {...args}></CheckButton>,
};
