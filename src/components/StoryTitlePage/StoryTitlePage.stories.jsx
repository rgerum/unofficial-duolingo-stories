import StoryTitlePage from "./StoryTitlePage";

const meta = {
  component: StoryTitlePage,
  argTypes: {
  },
};

export default meta;

export const Normal = {
  render: (args) => (
    <StoryTitlePage {...args}>
    </StoryTitlePage>
  ),
};
