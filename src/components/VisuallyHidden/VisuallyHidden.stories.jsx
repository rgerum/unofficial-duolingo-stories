import VisuallyHidden from "./VisuallyHidden";

const meta = {
  component: VisuallyHidden,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <VisuallyHidden {...args}>
    </VisuallyHidden>
  ),
};
