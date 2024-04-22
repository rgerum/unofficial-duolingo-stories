import DocsHeader from "./DocsHeader";

const meta = {
  component: DocsHeader,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <DocsHeader {...args}>
    </DocsHeader>
  ),
};
