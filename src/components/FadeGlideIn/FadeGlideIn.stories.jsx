import FadeGlideIn from "./FadeGlideIn";

const meta = {
  component: FadeGlideIn,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <FadeGlideIn {...args}>
    </FadeGlideIn>
  ),
};
