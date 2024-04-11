import DocsSearchModal from "./DocsSearchModal";

const meta = {
  component: DocsSearchModal,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <DocsSearchModal {...args}>
    </DocsSearchModal>
  ),
};
