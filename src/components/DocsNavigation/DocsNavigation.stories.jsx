import DocsNavigation from "./DocsNavigation";

const meta = {
  component: DocsNavigation,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <DocsNavigation {...args}>
    </DocsNavigation>
  ),
};
